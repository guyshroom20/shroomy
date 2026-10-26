-- Reports, the moderation queue and an audit log of every moderator action.
-- Anyone, signed in or not, can report a listing or photo (underage or
-- coercion reports must never need an account). Chat reports need to come
-- from a participant, and only reported conversations become visible to moderators.

create type public.report_reason as enum (
  'underage', 'coercion_or_trafficking', 'not_the_person', 'scam', 'harassment', 'spam', 'other'
);
create type public.report_status as enum ('open', 'actioned', 'dismissed');

create table public.reports (
  id bigint generated always as identity primary key,
  reporter_id uuid references public.accounts (id) on delete set null,
  reason public.report_reason not null,
  details text check (char_length(details) <= 2000),
  listing_id uuid references public.listings (id) on delete set null,
  photo_id uuid references public.listing_photos (id) on delete set null,
  conversation_id uuid references public.conversations (id) on delete set null,
  message_id bigint references public.messages (id) on delete set null,
  reported_account_id uuid references public.accounts (id) on delete set null,
  urgent boolean generated always as (reason in ('underage', 'coercion_or_trafficking')) stored,
  status public.report_status not null default 'open',
  handled_by uuid references public.accounts (id) on delete set null,
  handled_at timestamptz,
  resolution_note text,
  created_at timestamptz not null default now()
);

create index reports_queue_idx on public.reports (urgent desc, created_at) where status = 'open';
create index reports_reporter_idx on public.reports (reporter_id);
create index reports_listing_idx on public.reports (listing_id);
create index reports_photo_idx on public.reports (photo_id);
create index reports_conversation_idx on public.reports (conversation_id);
create index reports_message_idx on public.reports (message_id);
create index reports_account_idx on public.reports (reported_account_id);
create index reports_handled_by_idx on public.reports (handled_by);

alter table public.reports enable row level security;

revoke all on public.reports from anon, authenticated;
grant select on public.reports to authenticated;

create policy "Reports: reporters and moderators read" on public.reports
  for select to authenticated
  using (reporter_id = (select auth.uid()) or (select private.is_moderator()));

create function private.conversation_reported(p_conversation_id uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.reports where conversation_id = p_conversation_id);
$$;

create policy "Conversations: moderators read reported" on public.conversations
  for select to authenticated
  using ((select private.is_moderator()) and (select private.conversation_reported(id)));

create policy "Messages: moderators read reported" on public.messages
  for select to authenticated
  using ((select private.is_moderator()) and (select private.conversation_reported(conversation_id)));

create table public.moderation_log (
  id bigint generated always as identity primary key,
  moderator_id uuid references public.accounts (id) on delete set null,
  action text not null,
  listing_id uuid references public.listings (id) on delete set null,
  photo_id uuid references public.listing_photos (id) on delete set null,
  account_id uuid references public.accounts (id) on delete set null,
  report_id bigint references public.reports (id) on delete set null,
  note text,
  created_at timestamptz not null default now()
);

create index moderation_log_created_idx on public.moderation_log (created_at desc);
create index moderation_log_moderator_idx on public.moderation_log (moderator_id);
create index moderation_log_listing_idx on public.moderation_log (listing_id);
create index moderation_log_photo_idx on public.moderation_log (photo_id);
create index moderation_log_account_idx on public.moderation_log (account_id);
create index moderation_log_report_idx on public.moderation_log (report_id);

alter table public.moderation_log enable row level security;

revoke all on public.moderation_log from anon, authenticated;
grant select on public.moderation_log to authenticated;

create policy "Moderation log: moderators read" on public.moderation_log
  for select to authenticated
  using ((select private.is_moderator()));

create function private.require_moderator() returns uuid
language plpgsql stable security definer set search_path = '' as $$
begin
  if not private.is_moderator() then
    raise exception 'Moderator access required' using errcode = '42501';
  end if;
  return auth.uid();
end;
$$;

-- RPCs: reporting --------------------------------------------------------------

create function public.submit_report(
  p_reason public.report_reason,
  p_details text default null,
  p_listing_id uuid default null,
  p_photo_id uuid default null,
  p_message_id bigint default null
) returns bigint
language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := auth.uid();
  v_listing uuid := p_listing_id;
  v_conversation uuid;
  v_account uuid;
  v_id bigint;
begin
  if num_nonnulls(p_listing_id, p_photo_id, p_message_id) <> 1 then
    raise exception 'Report exactly one listing, photo or message' using errcode = '22023';
  end if;

  if p_photo_id is not null then
    select listing_id into v_listing from public.listing_photos where id = p_photo_id;
  end if;

  if p_message_id is not null then
    select m.conversation_id, m.sender_id into v_conversation, v_account
    from public.messages m
    join public.conversations c on c.id = m.conversation_id
    where m.id = p_message_id and v_uid in (c.visitor_id, c.advertiser_id);
    if v_conversation is null then
      raise exception 'Message not found' using errcode = 'P0002';
    end if;
    if v_account = v_uid then
      raise exception 'You can''t report your own message' using errcode = '22023';
    end if;
  else
    select advertiser_id into v_account
    from public.listings where id = v_listing and status = 'published';
    if v_account is null then
      raise exception 'Listing not found' using errcode = 'P0002';
    end if;
  end if;

  -- Signed-out reports can't be tied to anyone, so cap them site-wide.
  if v_uid is null and (
    select count(*) from public.reports
    where reporter_id is null and created_at > now() - interval '1 minute'
  ) >= 30 then
    raise exception 'Too many reports right now, try again shortly' using errcode = 'P0001';
  end if;

  -- One open report per person per target is enough.
  if v_uid is not null and exists (
    select 1 from public.reports
    where reporter_id = v_uid and status = 'open'
      and listing_id is not distinct from v_listing
      and photo_id is not distinct from p_photo_id
      and message_id is not distinct from p_message_id
  ) then
    return null;
  end if;

  insert into public.reports (
    reporter_id, reason, details, listing_id, photo_id, conversation_id, message_id, reported_account_id
  ) values (
    v_uid, p_reason, nullif(trim(p_details), ''), v_listing, p_photo_id, v_conversation, p_message_id, v_account
  ) returning id into v_id;
  return v_id;
end;
$$;

-- RPCs: advertiser -------------------------------------------------------------

create function public.submit_listing_for_review() returns void
language plpgsql security definer set search_path = '' as $$
begin
  update public.listings set status = 'pending_review'
  where advertiser_id = auth.uid() and status in ('draft', 'rejected')
    and exists (select 1 from public.listing_photos p where p.listing_id = listings.id);
  if not found then
    raise exception 'Add at least one photo to a draft listing first' using errcode = '22023';
  end if;
end;
$$;

-- RPCs: moderators -------------------------------------------------------------

create function public.review_listing(p_listing_id uuid, p_approve boolean, p_note text default null)
returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_mod uuid := private.require_moderator();
  v_listing public.listings;
begin
  select * into v_listing from public.listings where id = p_listing_id for update;
  if not found then
    raise exception 'Listing not found' using errcode = 'P0002';
  end if;

  if p_approve then
    if not exists (
      select 1 from public.accounts
      where id = v_listing.advertiser_id and id_verification = 'passed' and banned_at is null
    ) then
      raise exception 'The advertiser has not passed ID verification' using errcode = '22023';
    end if;
    if v_listing.approved_photo_count = 0 then
      raise exception 'Approve at least one photo first' using errcode = '22023';
    end if;
    update public.listings set
      status = 'published',
      needs_review = false,
      moderation_note = p_note,
      published_at = coalesce(published_at, now())
    where id = p_listing_id;
  else
    update public.listings set
      status = case when status = 'published' then 'suspended'::public.listing_status
                    else 'rejected'::public.listing_status end,
      needs_review = false,
      moderation_note = p_note
    where id = p_listing_id;
  end if;

  insert into public.moderation_log (moderator_id, action, listing_id, note)
  values (v_mod, case when p_approve then 'listing.approve' else 'listing.reject' end, p_listing_id, p_note);
end;
$$;

create function public.review_photo(p_photo_id uuid, p_approve boolean, p_reason text default null)
returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_mod uuid := private.require_moderator();
begin
  update public.listing_photos set
    status = case when p_approve then 'approved'::public.photo_status else 'rejected'::public.photo_status end,
    rejection_reason = case when p_approve then null else p_reason end,
    reviewed_by = v_mod,
    reviewed_at = now()
  where id = p_photo_id;
  if not found then
    raise exception 'Photo not found' using errcode = 'P0002';
  end if;

  insert into public.moderation_log (moderator_id, action, photo_id, note)
  values (v_mod, case when p_approve then 'photo.approve' else 'photo.reject' end, p_photo_id, p_reason);
end;
$$;

create function public.set_account_ban(p_account_id uuid, p_banned boolean, p_reason text default null)
returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_mod uuid := private.require_moderator();
begin
  if p_account_id = v_mod then
    raise exception 'You can''t ban yourself' using errcode = '22023';
  end if;
  update public.accounts set
    banned_at = case when p_banned then now() end,
    ban_reason = case when p_banned then p_reason end
  where id = p_account_id;
  if p_banned then
    update public.listings set status = 'suspended', moderation_note = p_reason
    where advertiser_id = p_account_id and status <> 'suspended';
  end if;

  insert into public.moderation_log (moderator_id, action, account_id, note)
  values (v_mod, case when p_banned then 'account.ban' else 'account.unban' end, p_account_id, p_reason);
end;
$$;

create function public.resolve_report(p_report_id bigint, p_status public.report_status, p_note text default null)
returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_mod uuid := private.require_moderator();
begin
  if p_status = 'open' then
    raise exception 'Use actioned or dismissed' using errcode = '22023';
  end if;
  update public.reports set
    status = p_status, handled_by = v_mod, handled_at = now(), resolution_note = p_note
  where id = p_report_id;
  if not found then
    raise exception 'Report not found' using errcode = 'P0002';
  end if;

  insert into public.moderation_log (moderator_id, action, report_id, note)
  values (v_mod, 'report.' || p_status::text, p_report_id, p_note);
end;
$$;

revoke execute on function public.submit_report(public.report_reason, text, uuid, uuid, bigint) from public;
revoke execute on function public.submit_listing_for_review() from public, anon;
revoke execute on function public.review_listing(uuid, boolean, text) from public, anon;
revoke execute on function public.review_photo(uuid, boolean, text) from public, anon;
revoke execute on function public.set_account_ban(uuid, boolean, text) from public, anon;
revoke execute on function public.resolve_report(bigint, public.report_status, text) from public, anon;

grant execute on function public.submit_report(public.report_reason, text, uuid, uuid, bigint) to anon, authenticated;
grant execute on function public.submit_listing_for_review() to authenticated;
grant execute on function public.review_listing(uuid, boolean, text) to authenticated;
grant execute on function public.review_photo(uuid, boolean, text) to authenticated;
grant execute on function public.set_account_ban(uuid, boolean, text) to authenticated;
grant execute on function public.resolve_report(bigint, public.report_status, text) to authenticated;
