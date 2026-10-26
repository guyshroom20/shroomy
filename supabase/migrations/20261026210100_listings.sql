-- Listings (the advertiser profiles shown in the app) and their photos.
-- One listing per advertiser account, one verified person per listing.
-- Nothing goes public until a moderator approves it.

create type public.listing_status as enum ('draft', 'pending_review', 'published', 'rejected', 'suspended');
create type public.availability as enum ('available', 'away', 'offline');
create type public.photo_status as enum ('pending', 'approved', 'rejected');

create table public.listings (
  id uuid primary key default gen_random_uuid(),
  advertiser_id uuid not null unique references public.accounts (id) on delete cascade,
  slug text not null unique check (slug ~ '^[a-z0-9][a-z0-9-]{2,39}$'),
  display_name text not null check (char_length(display_name) between 1 and 40),
  age smallint not null check (age between 18 and 99),
  bio text not null default '' check (char_length(bio) <= 2000),
  -- [{ "emoji": "🎬", "label": "Movie buff" }, ...]
  tags jsonb not null default '[]' check (jsonb_typeof(tags) = 'array' and jsonb_array_length(tags) <= 12),
  -- Town or area only, never an address.
  area text not null check (char_length(area) between 2 and 80),
  -- Rounded to 2 decimal places (roughly 1 km) so a pin can't reveal a home.
  approx_lat numeric(4, 2) check (approx_lat between 49 and 61),
  approx_lng numeric(4, 2) check (approx_lng between -9 and 2),
  availability public.availability not null default 'offline',
  status public.listing_status not null default 'draft',
  -- Set when a published listing is edited; the edit stays live but goes back in the queue.
  needs_review boolean not null default false,
  moderation_note text,
  approved_photo_count smallint not null default 0,
  locked_photo_count smallint not null default 0,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index listings_status_idx on public.listings (status) where status = 'published';
create index listings_review_queue_idx on public.listings (updated_at)
  where status = 'pending_review' or needs_review;

create trigger listings_set_updated_at before update on public.listings
  for each row execute function private.set_updated_at();

create function private.owns_listing(p_listing_id uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.listings
    where id = p_listing_id and advertiser_id = (select auth.uid())
  );
$$;

create function private.listing_is_published(p_listing_id uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.listings where id = p_listing_id and status = 'published'
  );
$$;

-- Keep content checks honest: round the location, keep the age in line with
-- the ID check, and flag edits to live listings for review.
create function private.listings_before_write() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  v_birth date;
begin
  new.approx_lat := round(new.approx_lat, 2);
  new.approx_lng := round(new.approx_lng, 2);

  select birth_date into v_birth from public.accounts where id = new.advertiser_id;
  if v_birth is not null
     and new.age <> extract(year from age(current_date, v_birth))::smallint then
    raise exception 'Age must match the verified date of birth' using errcode = 'check_violation';
  end if;

  if tg_op = 'UPDATE' and old.status = 'published'
     and (new.display_name, new.age, new.bio, new.tags, new.area)
         is distinct from (old.display_name, old.age, old.bio, old.tags, old.area) then
    new.needs_review := true;
  end if;
  return new;
end;
$$;

create trigger listings_before_write before insert or update on public.listings
  for each row execute function private.listings_before_write();

alter table public.listings enable row level security;

revoke all on public.listings from anon, authenticated;
grant select on public.listings to anon, authenticated;
grant insert (slug, display_name, age, bio, tags, area, approx_lat, approx_lng, availability)
  on public.listings to authenticated;
grant update (slug, display_name, age, bio, tags, area, approx_lat, approx_lng, availability)
  on public.listings to authenticated;
grant delete on public.listings to authenticated;

create policy "Listings: public can read published" on public.listings
  for select to anon, authenticated
  using (
    status = 'published'
    or advertiser_id = (select auth.uid())
    or (select private.is_moderator())
  );

create policy "Listings: advertisers create their own" on public.listings
  for insert to authenticated
  with check (
    advertiser_id = (select auth.uid())
    and (select private.has_role(array['advertiser']::public.account_role[]))
  );

create policy "Listings: owners edit" on public.listings
  for update to authenticated
  using (advertiser_id = (select auth.uid()) and (select private.is_active()))
  with check (advertiser_id = (select auth.uid()));

create policy "Listings: owners delete" on public.listings
  for delete to authenticated
  using (advertiser_id = (select auth.uid()));

alter table public.listings alter column advertiser_id set default auth.uid();

-- Photos ---------------------------------------------------------------------

create table public.listing_photos (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings (id) on delete cascade,
  -- Object name in the listing-photos bucket: "<listing_id>/<file>".
  storage_path text not null unique,
  position smallint not null default 0,
  -- Locked photos are only shown to signed-in, age-assured visitors.
  is_locked boolean not null default false,
  status public.photo_status not null default 'pending',
  rejection_reason text,
  reviewed_by uuid references public.accounts (id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  check (storage_path like listing_id::text || '/%')
);

create index listing_photos_listing_idx on public.listing_photos (listing_id, position);
create index listing_photos_queue_idx on public.listing_photos (created_at) where status = 'pending';
create index listing_photos_reviewed_by_idx on public.listing_photos (reviewed_by);

-- Unlocking a photo makes it public, so it has to be reviewed again.
create function private.listing_photos_before_update() returns trigger
language plpgsql set search_path = '' as $$
begin
  if old.is_locked and not new.is_locked then
    new.status := 'pending';
    new.reviewed_by := null;
    new.reviewed_at := null;
  end if;
  return new;
end;
$$;

create trigger listing_photos_before_update before update on public.listing_photos
  for each row execute function private.listing_photos_before_update();

create function private.refresh_photo_counts() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  v_listing uuid := coalesce(new.listing_id, old.listing_id);
begin
  update public.listings l set
    approved_photo_count = c.approved,
    locked_photo_count = c.locked
  from (
    select
      count(*) filter (where status = 'approved')::smallint as approved,
      count(*) filter (where status = 'approved' and is_locked)::smallint as locked
    from public.listing_photos where listing_id = v_listing
  ) c
  where l.id = v_listing;
  return null;
end;
$$;

create trigger listing_photos_counts after insert or update or delete on public.listing_photos
  for each row execute function private.refresh_photo_counts();

alter table public.listing_photos enable row level security;

revoke all on public.listing_photos from anon, authenticated;
grant select on public.listing_photos to anon, authenticated;
grant insert (listing_id, storage_path, position, is_locked) on public.listing_photos to authenticated;
grant update (position, is_locked) on public.listing_photos to authenticated;
grant delete on public.listing_photos to authenticated;

create policy "Photos: approved photos of published listings" on public.listing_photos
  for select to anon, authenticated
  using (
    (
      status = 'approved'
      and (select private.listing_is_published(listing_id))
      and (not is_locked or (select private.is_age_assured()))
    )
    or (select private.owns_listing(listing_id))
    or (select private.is_moderator())
  );

create policy "Photos: owners add" on public.listing_photos
  for insert to authenticated
  with check ((select private.owns_listing(listing_id)) and (select private.is_active()));

create policy "Photos: owners reorder and lock" on public.listing_photos
  for update to authenticated
  using ((select private.owns_listing(listing_id)) and (select private.is_active()))
  with check ((select private.owns_listing(listing_id)));

create policy "Photos: owners delete" on public.listing_photos
  for delete to authenticated
  using ((select private.owns_listing(listing_id)));

-- Storage --------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('listing-photos', 'listing-photos', false, 10485760, array['image/jpeg', 'image/png', 'image/webp']);

create function private.owns_listing_folder(p_name text) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.listings
    where id::text = (storage.foldername(p_name))[1]
      and advertiser_id = (select auth.uid())
  );
$$;

-- Readable when the matching listing_photos row is visible to the caller,
-- so the photo rules above decide who can fetch a signed URL.
create policy "listing-photos: read visible photos" on storage.objects
  for select to anon, authenticated
  using (
    bucket_id = 'listing-photos'
    and (
      exists (select 1 from public.listing_photos p where p.storage_path = name)
      or (select private.owns_listing_folder(name))
    )
  );

create policy "listing-photos: owners upload" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'listing-photos'
    and (select private.owns_listing_folder(name))
    and (select private.is_active())
  );

create policy "listing-photos: owners delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'listing-photos' and (select private.owns_listing_folder(name)));
