-- Accounts: one row per auth user. Visitors browse, shortlist and message;
-- advertisers own exactly one listing. Moderators and admins are set by hand.

create type public.account_role as enum ('visitor', 'advertiser', 'moderator', 'admin');
create type public.verification_status as enum ('none', 'pending', 'passed', 'failed');

create table public.accounts (
  id uuid primary key references auth.users (id) on delete cascade,
  role public.account_role not null default 'visitor',
  display_name text check (char_length(display_name) between 1 and 40),
  -- Advertisers: document + liveness check (Yoti/OneID). Proves identity and age.
  id_verification public.verification_status not null default 'none',
  id_verified_at timestamptz,
  -- From the ID check only. Never typed in by the user.
  birth_date date,
  -- Visitors: age assurance (VerifyMy etc). A passed ID check also counts.
  age_assurance public.verification_status not null default 'none',
  age_assured_at timestamptz,
  banned_at timestamptz,
  ban_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Helpers used by RLS policies. They live in a schema the Data API doesn't
-- expose, run as definer so policies don't recurse, and always key off auth.uid().
create schema if not exists private;
grant usage on schema private to anon, authenticated, service_role;

create function private.set_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger accounts_set_updated_at before update on public.accounts
  for each row execute function private.set_updated_at();

create function private.is_active() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.accounts
    where id = (select auth.uid()) and banned_at is null
  );
$$;

create function private.has_role(roles public.account_role[]) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.accounts
    where id = (select auth.uid()) and banned_at is null and role = any (roles)
  );
$$;

create function private.is_moderator() returns boolean
language sql stable security definer set search_path = '' as $$
  select private.has_role(array['moderator', 'admin']::public.account_role[]);
$$;

create function private.is_age_assured() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.accounts
    where id = (select auth.uid()) and banned_at is null and age_assurance = 'passed'
  );
$$;

-- New auth user -> account row. The sign-up form passes role in user metadata;
-- only visitor or advertiser can be chosen there.
create function private.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.accounts (id, role, display_name)
  values (
    new.id,
    case when new.raw_user_meta_data ->> 'role' = 'advertiser'
      then 'advertiser'::public.account_role
      else 'visitor'::public.account_role end,
    nullif(left(trim(new.raw_user_meta_data ->> 'display_name'), 40), '')
  );
  return new;
end;
$$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function private.handle_new_user();

alter table public.accounts enable row level security;

revoke all on public.accounts from anon, authenticated;
grant select on public.accounts to authenticated;
grant update (display_name) on public.accounts to authenticated;

create policy "Accounts: read own" on public.accounts
  for select to authenticated
  using ((select auth.uid()) = id or (select private.is_moderator()));

create policy "Accounts: edit own display name" on public.accounts
  for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);
