-- Advertiser onboarding: the consent statements each advertiser ticks, a
-- private safety check-in, account signals (hashed phone numbers, devices,
-- cards) and risk flags. Flags are for moderators only: they never block
-- anyone on their own, and the advertiser never sees them.

-- Consent statements -----------------------------------------------------------

-- The wording is versioned. Changing it means inserting a new version, which
-- asks every advertiser to agree again before their next submission.
create table public.consent_statements (
  key text not null check (key ~ '^[a-z_]{2,40}$'),
  version smallint not null check (version > 0),
  position smallint not null,
  wording text not null check (char_length(wording) between 10 and 600),
  primary key (key, version)
);

alter table public.consent_statements enable row level security;

revoke all on public.consent_statements from anon, authenticated;
grant select on public.consent_statements to anon, authenticated;

create policy "Consent statements: anyone can read" on public.consent_statements
  for select to anon, authenticated using (true);

insert into public.consent_statements (key, version, position, wording) values
  ('adult', 1, 1, 'I am 18 or over, and the ID I am about to show is my own.'),
  ('own_choice', 1, 2, 'I am advertising by my own choice. Nobody has pressured, threatened or paid me to do this.'),
  ('no_third_party', 1, 3, 'Nobody else runs this account, arranges my bookings, sets my prices or takes any of my earnings.'),
  ('own_photos', 1, 4, 'Every photo I upload is of me, I have the right to use it, and nobody else appears in it.'),
  ('no_payments', 1, 5, 'shroom only sells advertising. It never handles booking payments, and I will not ask clients to pay through it.'),
  ('house_rules', 1, 6, 'I will follow the house rules and the law. A moderator checks my profile and photos before they go live, and shroom works with the police when someone is at risk.'),
  ('can_leave', 1, 7, 'I know I can pause or delete my profile at any time, and where to get confidential help.');

create function private.current_consent_version() returns smallint
language sql stable security definer set search_path = '' as $$
  select max(version) from public.consent_statements;
$$;

create table public.consents (
  id bigint generated always as identity primary key,
  account_id uuid not null references public.accounts (id) on delete cascade,
  statement_key text not null,
  statement_version smallint not null,
  accepted_at timestamptz not null default now(),
  foreign key (statement_key, statement_version) references public.consent_statements (key, version),
  unique (account_id, statement_key, statement_version)
);

create index consents_statement_idx on public.consents (statement_key, statement_version);

alter table public.consents enable row level security;

revoke all on public.consents from anon, authenticated;
grant select on public.consents to authenticated;

create policy "Consents: own and moderators" on public.consents
  for select to authenticated
  using (account_id = (select auth.uid()) or (select private.is_moderator()));

create function private.consents_complete(p_account_id uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select not exists (
    select 1 from public.consent_statements s
    where s.version = private.current_consent_version()
      and not exists (
        select 1 from public.consents c
        where c.account_id = p_account_id and c.statement_key = s.key and c.statement_version = s.version
      )
  );
$$;

-- The advertiser ticks every statement of the current version. A partial set
-- is refused, so a consent is never recorded on its own out of context.
create function public.give_consents(p_keys text[]) returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := auth.uid();
  v_version smallint := private.current_consent_version();
begin
  if not private.has_role(array['advertiser']::public.account_role[]) then
    raise exception 'Only advertisers give these consents' using errcode = '42501';
  end if;
  if exists (
    select 1 from public.consent_statements
    where version = v_version and key <> all (coalesce(p_keys, '{}'))
  ) or exists (
    select 1 from unnest(p_keys) k
    where not exists (select 1 from public.consent_statements where version = v_version and key = k)
  ) then
    raise exception 'Agree to every statement to continue' using errcode = '22023';
  end if;

  insert into public.consents (account_id, statement_key, statement_version)
  select v_uid, k, v_version from unnest(p_keys) k
  on conflict do nothing;
end;
$$;

-- Risk flags -------------------------------------------------------------------

create type public.risk_flag_kind as enum (
  'shared_phone', 'shared_device', 'shared_payment_card', 'repeated_id_failures', 'safety_checkin', 'profile_wording'
);
create type public.risk_severity as enum ('review', 'urgent');
create type public.risk_flag_status as enum ('open', 'cleared', 'actioned');

create table public.risk_flags (
  id bigint generated always as identity primary key,
  account_id uuid not null references public.accounts (id) on delete cascade,
  kind public.risk_flag_kind not null,
  severity public.risk_severity not null,
  detail text not null check (char_length(detail) <= 1000),
  -- The other account, for flags about something two accounts share.
  related_account_id uuid references public.accounts (id) on delete set null,
  status public.risk_flag_status not null default 'open',
  handled_by uuid references public.accounts (id) on delete set null,
  handled_at timestamptz,
  resolution_note text check (char_length(resolution_note) <= 2000),
  created_at timestamptz not null default now()
);

-- One open flag per account, kind and related account is enough.
create unique index risk_flags_one_open_idx on public.risk_flags
  (account_id, kind, coalesce(related_account_id, '00000000-0000-0000-0000-000000000000'::uuid))
  where status = 'open';
create index risk_flags_queue_idx on public.risk_flags (severity desc, created_at) where status = 'open';
create index risk_flags_related_idx on public.risk_flags (related_account_id);
create index risk_flags_handled_by_idx on public.risk_flags (handled_by);

alter table public.risk_flags enable row level security;

revoke all on public.risk_flags from anon, authenticated;
grant select on public.risk_flags to authenticated;

create policy "Risk flags: moderators only" on public.risk_flags
  for select to authenticated
  using ((select private.is_moderator()));

-- Raises a flag. Urgent flags also go into the reports queue as a coercion
-- report, so they sit at the top of what moderators see.
create function public.raise_risk_flag(
  p_account_id uuid,
  p_kind public.risk_flag_kind,
  p_severity public.risk_severity,
  p_detail text,
  p_related_account_id uuid default null
) returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_id bigint;
begin
  insert into public.risk_flags (account_id, kind, severity, detail, related_account_id)
  values (p_account_id, p_kind, p_severity, left(p_detail, 1000), p_related_account_id)
  on conflict (account_id, kind, coalesce(related_account_id, '00000000-0000-0000-0000-000000000000'::uuid))
    where status = 'open'
  do update set severity = greatest(public.risk_flags.severity, excluded.severity), detail = excluded.detail
  returning id into v_id;

  if p_severity = 'urgent' and not exists (
    select 1 from public.reports
    where reported_account_id = p_account_id and reason = 'coercion_or_trafficking' and status = 'open' and reporter_id is null
  ) then
    insert into public.reports (reason, details, reported_account_id, listing_id)
    select 'coercion_or_trafficking', left('Automatic: ' || p_detail, 2000), p_account_id,
      (select id from public.listings where advertiser_id = p_account_id);
  end if;
end;
$$;

create function public.resolve_risk_flag(p_flag_id bigint, p_status public.risk_flag_status, p_note text default null)
returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_mod uuid := private.require_moderator();
  v_account uuid;
begin
  if p_status = 'open' then
    raise exception 'Choose cleared or actioned' using errcode = '22023';
  end if;
  update public.risk_flags set status = p_status, handled_by = v_mod, handled_at = now(), resolution_note = p_note
  where id = p_flag_id and status = 'open'
  returning account_id into v_account;
  if not found then
    raise exception 'Flag not found or already handled' using errcode = 'P0002';
  end if;
  insert into public.moderation_log (moderator_id, action, account_id, note)
  values (v_mod, 'risk_flag.' || p_status, v_account, p_note);
end;
$$;

-- Account signals --------------------------------------------------------------

-- Keyed hashes (HMAC with a server secret), never the raw values, so the
-- table can show that two accounts share a phone or device without revealing either.
create type public.signal_kind as enum ('phone', 'device', 'payment_card');

create table public.account_signals (
  account_id uuid not null references public.accounts (id) on delete cascade,
  kind public.signal_kind not null,
  value_hash text not null check (value_hash ~ '^[0-9a-f]{64}$'),
  first_seen timestamptz not null default now(),
  primary key (account_id, kind, value_hash)
);

create index account_signals_lookup_idx on public.account_signals (kind, value_hash);

alter table public.account_signals enable row level security;

revoke all on public.account_signals from anon, authenticated;

-- Called by the server. Two advertiser accounts sharing a phone, device or card
-- are both flagged; three or more is urgent, because it looks like one person
-- running several profiles.
create function public.record_account_signal(p_account_id uuid, p_kind public.signal_kind, p_hash text)
returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_other record;
  v_count int;
  v_kind public.risk_flag_kind := case p_kind
    when 'phone' then 'shared_phone'::public.risk_flag_kind
    when 'device' then 'shared_device'::public.risk_flag_kind
    else 'shared_payment_card'::public.risk_flag_kind end;
  v_severity public.risk_severity;
begin
  insert into public.account_signals (account_id, kind, value_hash)
  values (p_account_id, p_kind, p_hash)
  on conflict do nothing;

  if not exists (select 1 from public.accounts where id = p_account_id and role = 'advertiser') then
    return;
  end if;

  select count(distinct s.account_id) into v_count
  from public.account_signals s join public.accounts a on a.id = s.account_id
  where s.kind = p_kind and s.value_hash = p_hash and a.role = 'advertiser';
  v_severity := case when v_count >= 3 then 'urgent'::public.risk_severity else 'review'::public.risk_severity end;

  for v_other in
    select s.account_id from public.account_signals s join public.accounts a on a.id = s.account_id
    where s.kind = p_kind and s.value_hash = p_hash and a.role = 'advertiser' and s.account_id <> p_account_id
  loop
    perform public.raise_risk_flag(p_account_id, v_kind, v_severity,
      format('Same %s as another advertiser account (%s accounts in total)', replace(p_kind::text, '_', ' '), v_count),
      v_other.account_id);
    perform public.raise_risk_flag(v_other.account_id, v_kind, v_severity,
      format('Same %s as another advertiser account (%s accounts in total)', replace(p_kind::text, '_', ' '), v_count),
      p_account_id);
  end loop;
end;
$$;

-- Safety check-in --------------------------------------------------------------

create table public.safety_checkins (
  id bigint generated always as identity primary key,
  account_id uuid not null references public.accounts (id) on delete cascade,
  others_involved text not null check (others_involved in ('no', 'yes', 'prefer_not_to_say')),
  free_to_stop text not null check (free_to_stop in ('yes', 'no', 'not_sure')),
  wants_contact boolean not null default false,
  created_at timestamptz not null default now()
);

create index safety_checkins_account_idx on public.safety_checkins (account_id, created_at desc);

alter table public.safety_checkins enable row level security;

-- Only moderators read the answers. The advertiser's own screen may be watched
-- by the person controlling them, so the app never shows the answers back.
revoke all on public.safety_checkins from anon, authenticated;
grant select on public.safety_checkins to authenticated;

create policy "Safety check-ins: moderators only" on public.safety_checkins
  for select to authenticated
  using ((select private.is_moderator()));

create function public.submit_safety_checkin(p_others_involved text, p_free_to_stop text, p_wants_contact boolean)
returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := auth.uid();
  v_urgent boolean := p_others_involved = 'yes' or p_free_to_stop = 'no' or p_wants_contact;
  v_review boolean := p_others_involved = 'prefer_not_to_say' or p_free_to_stop = 'not_sure';
begin
  if not private.has_role(array['advertiser']::public.account_role[]) then
    raise exception 'Only advertisers answer the check-in' using errcode = '42501';
  end if;
  insert into public.safety_checkins (account_id, others_involved, free_to_stop, wants_contact)
  values (v_uid, p_others_involved, p_free_to_stop, coalesce(p_wants_contact, false));

  if v_urgent or v_review then
    perform public.raise_risk_flag(v_uid, 'safety_checkin',
      case when v_urgent then 'urgent'::public.risk_severity else 'review'::public.risk_severity end,
      format('Safety check-in: others involved = %s, free to stop = %s, wants contact = %s',
        p_others_involved, p_free_to_stop, coalesce(p_wants_contact, false)));
  end if;
end;
$$;

-- Where the advertiser is in onboarding, without revealing any answers.
create function public.my_onboarding()
returns table (consents_done boolean, consent_version smallint, phone_done boolean, checkin_done boolean)
language sql stable security definer set search_path = '' as $$
  select
    private.consents_complete(auth.uid()),
    private.current_consent_version(),
    exists (select 1 from public.account_signals where account_id = auth.uid() and kind = 'phone'),
    exists (select 1 from public.safety_checkins where account_id = auth.uid())
  where auth.uid() is not null;
$$;

-- Automatic flags --------------------------------------------------------------

-- Three failed ID checks and no pass: someone may be trying with documents
-- that aren't theirs.
create function private.flag_repeated_id_failures() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  v_failed int;
begin
  if new.kind = 'id_verification' and new.status = 'failed' and old.status is distinct from 'failed' then
    select count(*) into v_failed from public.verification_checks
    where account_id = new.account_id and kind = 'id_verification' and status = 'failed';
    if v_failed >= 3 and not exists (
      select 1 from public.accounts where id = new.account_id and id_verification = 'passed'
    ) then
      perform public.raise_risk_flag(new.account_id, 'repeated_id_failures', 'review',
        format('%s failed ID checks; last reason: %s', v_failed, coalesce(new.failure_reason, 'none given')));
    end if;
  end if;
  return null;
end;
$$;

create trigger verification_checks_flag_failures after update of status on public.verification_checks
  for each row execute function private.flag_repeated_id_failures();

-- Words that suggest the profile is written or run by someone else.
create function private.flag_profile_wording() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  v_hits text[];
begin
  select array_agg(distinct lower(m[1])) into v_hits
  from regexp_matches(
    coalesce(new.bio, '') || ' ' || coalesce(new.display_name, '') || ' ' || coalesce(new.tags::text, ''),
    '\m(agency|agencies|manager|booker|my driver|our girls|new girls|girls available|we offer|we are|ask for my friend)\M',
    'gi') as m;
  if v_hits is not null then
    perform public.raise_risk_flag(new.advertiser_id, 'profile_wording', 'review',
      'Profile mentions: ' || array_to_string(v_hits, ', '));
  end if;
  return null;
end;
$$;

create trigger listings_flag_wording after insert or update of bio, display_name, tags on public.listings
  for each row execute function private.flag_profile_wording();

-- Submitting for review now also needs the consents and the safety check-in.
create or replace function public.submit_listing_for_review() returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not private.consents_complete(auth.uid()) then
    raise exception 'Agree to the advertiser statements first' using errcode = '22023';
  end if;
  if not exists (select 1 from public.safety_checkins where account_id = auth.uid()) then
    raise exception 'Answer the safety check-in first' using errcode = '22023';
  end if;
  update public.listings set status = 'pending_review'
  where advertiser_id = auth.uid() and status in ('draft', 'rejected')
    and exists (select 1 from public.listing_photos p where p.listing_id = listings.id);
  if not found then
    raise exception 'Add at least one photo to a draft listing first' using errcode = '22023';
  end if;
end;
$$;

-- Grants -----------------------------------------------------------------------

revoke execute on function public.give_consents(text[]) from public, anon;
revoke execute on function public.submit_safety_checkin(text, text, boolean) from public, anon;
revoke execute on function public.my_onboarding() from public, anon;
revoke execute on function public.resolve_risk_flag(bigint, public.risk_flag_status, text) from public, anon;
revoke execute on function public.raise_risk_flag(uuid, public.risk_flag_kind, public.risk_severity, text, uuid) from public, anon, authenticated;
revoke execute on function public.record_account_signal(uuid, public.signal_kind, text) from public, anon, authenticated;

grant execute on function public.give_consents(text[]) to authenticated;
grant execute on function public.submit_safety_checkin(text, text, boolean) to authenticated;
grant execute on function public.my_onboarding() to authenticated;
grant execute on function public.resolve_risk_flag(bigint, public.risk_flag_status, text) to authenticated;
grant execute on function public.raise_risk_flag(uuid, public.risk_flag_kind, public.risk_severity, text, uuid) to service_role;
grant execute on function public.record_account_signal(uuid, public.signal_kind, text) to service_role;
