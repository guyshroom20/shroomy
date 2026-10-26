-- ID verification (advertisers) and age assurance (visitors) are done by an
-- outside provider. We keep a record of each check and its outcome, never
-- the documents or selfies themselves. Only the server (service role) writes
-- here, from the provider's webhook.

create type public.check_kind as enum ('id_verification', 'age_assurance');

create table public.verification_checks (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.accounts (id) on delete cascade,
  kind public.check_kind not null,
  provider text not null,
  provider_ref text,
  status public.verification_status not null default 'pending',
  failure_reason text,
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  unique (provider, provider_ref)
);

create index verification_checks_account_idx on public.verification_checks (account_id, created_at desc);

alter table public.verification_checks enable row level security;

revoke all on public.verification_checks from anon, authenticated;
grant select on public.verification_checks to authenticated;

create policy "Verification: own checks" on public.verification_checks
  for select to authenticated
  using (account_id = (select auth.uid()) or (select private.is_moderator()));

-- Called by the server when a check starts. Marks the account as pending.
create function public.begin_verification_check(
  p_account_id uuid, p_kind public.check_kind, p_provider text
) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  v_id uuid;
begin
  insert into public.verification_checks (account_id, kind, provider)
  values (p_account_id, p_kind, p_provider)
  returning id into v_id;

  if p_kind = 'id_verification' then
    update public.accounts set id_verification = 'pending'
    where id = p_account_id and id_verification <> 'passed';
  else
    update public.accounts set age_assurance = 'pending'
    where id = p_account_id and age_assurance <> 'passed';
  end if;
  return v_id;
end;
$$;

-- Called by the provider webhook handler with the outcome.
create function public.complete_verification_check(
  p_check_id uuid,
  p_passed boolean,
  p_provider_ref text default null,
  p_birth_date date default null,
  p_failure_reason text default null
) returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_check public.verification_checks;
  v_passed boolean := p_passed;
  v_reason text := p_failure_reason;
begin
  select * into v_check from public.verification_checks where id = p_check_id for update;
  if not found then
    raise exception 'Check not found' using errcode = 'P0002';
  end if;
  if v_check.status in ('passed', 'failed') then
    return; -- webhooks can be delivered more than once
  end if;

  if v_passed and p_birth_date is not null and p_birth_date > (current_date - interval '18 years')::date then
    v_passed := false;
    v_reason := 'under_18';
  end if;
  if v_passed and v_check.kind = 'id_verification' and p_birth_date is null then
    v_passed := false;
    v_reason := coalesce(v_reason, 'no_birth_date');
  end if;

  update public.verification_checks set
    status = case when v_passed then 'passed'::public.verification_status else 'failed'::public.verification_status end,
    provider_ref = coalesce(p_provider_ref, provider_ref),
    failure_reason = case when v_passed then null else v_reason end,
    completed_at = now()
  where id = p_check_id;

  if v_check.kind = 'id_verification' then
    if v_passed then
      -- A document check proves age as well.
      update public.accounts set
        id_verification = 'passed', id_verified_at = now(), birth_date = p_birth_date,
        age_assurance = 'passed', age_assured_at = coalesce(age_assured_at, now())
      where id = v_check.account_id;
      update public.listings set age = extract(year from age(current_date, p_birth_date))::smallint
      where advertiser_id = v_check.account_id;
    else
      update public.accounts set id_verification = 'failed'
      where id = v_check.account_id and id_verification <> 'passed';
    end if;
  else
    update public.accounts set
      age_assurance = case when v_passed then 'passed'::public.verification_status else 'failed'::public.verification_status end,
      age_assured_at = case when v_passed then now() else age_assured_at end
    where id = v_check.account_id and age_assurance <> 'passed';
  end if;

  -- Someone under 18 tried to verify: take any listing down and put it at the
  -- top of the moderators' queue.
  if v_reason = 'under_18' then
    update public.listings set status = 'suspended', moderation_note = 'Failed ID check: under 18'
    where advertiser_id = v_check.account_id;
    insert into public.reports (reason, details, reported_account_id, listing_id)
    select 'underage', 'Automatic: ID check returned a date of birth under 18', v_check.account_id,
      (select id from public.listings where advertiser_id = v_check.account_id);
  end if;
end;
$$;

revoke execute on function public.begin_verification_check(uuid, public.check_kind, text) from public, anon, authenticated;
revoke execute on function public.complete_verification_check(uuid, boolean, text, date, text) from public, anon, authenticated;
grant execute on function public.begin_verification_check(uuid, public.check_kind, text) to service_role;
grant execute on function public.complete_verification_check(uuid, boolean, text, date, text) to service_role;
