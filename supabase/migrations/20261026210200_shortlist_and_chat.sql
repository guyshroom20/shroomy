-- Shortlist (the heart button), blocks and one-to-one chat between a visitor
-- and an advertiser. Only age-assured visitors can start a conversation.

create table public.shortlist (
  account_id uuid not null default auth.uid() references public.accounts (id) on delete cascade,
  listing_id uuid not null references public.listings (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (account_id, listing_id)
);

create index shortlist_listing_idx on public.shortlist (listing_id);

alter table public.shortlist enable row level security;

revoke all on public.shortlist from anon, authenticated;
grant select, delete on public.shortlist to authenticated;
grant insert (listing_id) on public.shortlist to authenticated;

create policy "Shortlist: own rows" on public.shortlist
  for all to authenticated
  using (account_id = (select auth.uid()))
  with check (
    account_id = (select auth.uid())
    and (select private.is_active())
    and (select private.listing_is_published(listing_id))
  );

-- Blocks ---------------------------------------------------------------------

create table public.blocks (
  blocker_id uuid not null default auth.uid() references public.accounts (id) on delete cascade,
  blocked_id uuid not null references public.accounts (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);

create index blocks_blocked_idx on public.blocks (blocked_id);

create function private.is_blocked_between(a uuid, b uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.blocks
    where (blocker_id = a and blocked_id = b) or (blocker_id = b and blocked_id = a)
  );
$$;

alter table public.blocks enable row level security;

revoke all on public.blocks from anon, authenticated;
grant select, delete on public.blocks to authenticated;
grant insert (blocked_id) on public.blocks to authenticated;

create policy "Blocks: own rows" on public.blocks
  for all to authenticated
  using (blocker_id = (select auth.uid()))
  with check (blocker_id = (select auth.uid()));

-- Conversations --------------------------------------------------------------

create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings (id) on delete cascade,
  visitor_id uuid not null references public.accounts (id) on delete cascade,
  -- Copied from the listing so RLS checks don't need a join.
  advertiser_id uuid not null references public.accounts (id) on delete cascade,
  last_message_at timestamptz,
  created_at timestamptz not null default now(),
  unique (listing_id, visitor_id)
);

create index conversations_visitor_idx on public.conversations (visitor_id, last_message_at desc);
create index conversations_advertiser_idx on public.conversations (advertiser_id, last_message_at desc);

create function private.is_participant(p_conversation_id uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.conversations
    where id = p_conversation_id
      and (select auth.uid()) in (visitor_id, advertiser_id)
  );
$$;

alter table public.conversations enable row level security;

revoke all on public.conversations from anon, authenticated;
grant select on public.conversations to authenticated;

-- Moderators can only open a conversation once someone has reported it
-- (see the reports migration, which adds that policy).
create policy "Conversations: participants" on public.conversations
  for select to authenticated
  using ((select auth.uid()) in (visitor_id, advertiser_id));

-- Messages -------------------------------------------------------------------

create table public.messages (
  id bigint generated always as identity primary key,
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  sender_id uuid not null default auth.uid() references public.accounts (id) on delete cascade,
  body text not null check (char_length(trim(body)) between 1 and 2000),
  created_at timestamptz not null default now(),
  read_at timestamptz
);

create index messages_conversation_idx on public.messages (conversation_id, id desc);
create index messages_sender_idx on public.messages (sender_id, created_at desc);

create function private.can_send(p_conversation_id uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1
    from public.conversations c
    join public.listings l on l.id = c.listing_id
    where c.id = p_conversation_id
      and (select auth.uid()) in (c.visitor_id, c.advertiser_id)
      and l.status = 'published'
      and not private.is_blocked_between(c.visitor_id, c.advertiser_id)
  ) and private.is_active();
$$;

-- Basic flood control, plus keeping the inbox order fresh.
create function private.messages_before_insert() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if (
    select count(*) from public.messages
    where sender_id = new.sender_id and created_at > now() - interval '1 minute'
  ) >= 20 then
    raise exception 'Too many messages, slow down' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

create trigger messages_before_insert before insert on public.messages
  for each row execute function private.messages_before_insert();

create function private.messages_after_insert() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  update public.conversations set last_message_at = new.created_at
  where id = new.conversation_id;
  return null;
end;
$$;

create trigger messages_after_insert after insert on public.messages
  for each row execute function private.messages_after_insert();

alter table public.messages enable row level security;

revoke all on public.messages from anon, authenticated;
grant select on public.messages to authenticated;
grant insert (conversation_id, body) on public.messages to authenticated;

create policy "Messages: participants read" on public.messages
  for select to authenticated
  using ((select private.is_participant(conversation_id)));

create policy "Messages: participants send" on public.messages
  for insert to authenticated
  with check (
    sender_id = (select auth.uid())
    and (select private.can_send(conversation_id))
  );

alter publication supabase_realtime add table public.messages;

-- RPCs -----------------------------------------------------------------------

-- Opens (or returns) the visitor's conversation with a listing.
create function public.start_conversation(p_listing_id uuid) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := auth.uid();
  v_advertiser uuid;
  v_id uuid;
begin
  if not private.has_role(array['visitor']::public.account_role[]) then
    raise exception 'Only visitor accounts can start a conversation' using errcode = '42501';
  end if;
  if not private.is_age_assured() then
    raise exception 'Age check required before messaging' using errcode = '42501';
  end if;

  select advertiser_id into v_advertiser
  from public.listings where id = p_listing_id and status = 'published';
  if v_advertiser is null then
    raise exception 'Listing not available' using errcode = 'P0002';
  end if;
  if private.is_blocked_between(v_uid, v_advertiser) then
    raise exception 'You can''t message this person' using errcode = '42501';
  end if;

  insert into public.conversations (listing_id, visitor_id, advertiser_id)
  values (p_listing_id, v_uid, v_advertiser)
  on conflict (listing_id, visitor_id) do update set listing_id = excluded.listing_id
  returning id into v_id;
  return v_id;
end;
$$;

create function public.mark_conversation_read(p_conversation_id uuid) returns void
language sql security definer set search_path = '' as $$
  update public.messages set read_at = now()
  where conversation_id = p_conversation_id
    and sender_id <> (select auth.uid())
    and read_at is null
    and private.is_participant(p_conversation_id);
$$;

-- Inbox: one row per conversation with the other person's name and the
-- latest message. Definer so advertisers can see a visitor's display name
-- without being able to read the accounts table.
create function public.my_conversations()
returns table (
  conversation_id uuid,
  listing_id uuid,
  listing_slug text,
  partner_id uuid,
  partner_name text,
  is_advertiser boolean,
  last_message text,
  last_message_at timestamptz,
  last_message_from_me boolean,
  unread_count bigint,
  blocked boolean
)
language sql stable security definer set search_path = '' as $$
  select
    c.id,
    c.listing_id,
    l.slug,
    case when me.is_adv then c.visitor_id else c.advertiser_id end,
    case when me.is_adv then coalesce(a.display_name, 'Visitor') else l.display_name end,
    me.is_adv,
    m.body,
    coalesce(m.created_at, c.created_at),
    m.sender_id = me.uid,
    (select count(*) from public.messages u
      where u.conversation_id = c.id and u.sender_id <> me.uid and u.read_at is null),
    private.is_blocked_between(c.visitor_id, c.advertiser_id)
  from public.conversations c
  cross join lateral (
    select (select auth.uid()) as uid, c.advertiser_id = (select auth.uid()) as is_adv
  ) me
  join public.listings l on l.id = c.listing_id
  left join public.accounts a on a.id = c.visitor_id
  left join lateral (
    select body, created_at, sender_id from public.messages
    where conversation_id = c.id order by id desc limit 1
  ) m on true
  where me.uid in (c.visitor_id, c.advertiser_id)
  order by coalesce(m.created_at, c.created_at) desc;
$$;

revoke execute on function public.start_conversation(uuid) from public, anon;
revoke execute on function public.mark_conversation_read(uuid) from public, anon;
revoke execute on function public.my_conversations() from public, anon;
grant execute on function public.start_conversation(uuid) to authenticated;
grant execute on function public.mark_conversation_read(uuid) to authenticated;
grant execute on function public.my_conversations() to authenticated;
