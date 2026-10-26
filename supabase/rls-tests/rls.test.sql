-- End-to-end checks of the access rules. Runs inside one transaction that is
-- rolled back, so it leaves no data behind. See supabase/tests/README.md.

\set ON_ERROR_STOP 1
begin;

create schema tests;
grant usage on schema tests to anon, authenticated, service_role;

create function tests.ok(p_cond boolean, p_what text) returns void language plpgsql as $$
begin
  if p_cond is not true then
    raise exception 'FAIL: %', p_what;
  end if;
  raise notice 'ok - %', p_what;
end;
$$;

-- Runs p_sql and passes only if it raises an error.
create function tests.throws(p_sql text, p_what text) returns void language plpgsql as $$
begin
  begin
    execute p_sql;
  exception when others then
    raise notice 'ok - % (%)', p_what, sqlerrm;
    return;
  end;
  raise exception 'FAIL: expected an error: %', p_what;
end;
$$;

create function tests.count(p_sql text) returns bigint language plpgsql as $$
declare n bigint;
begin
  execute 'select count(*) from (' || p_sql || ') t' into n;
  return n;
end;
$$;

grant execute on all functions in schema tests to anon, authenticated, service_role;

create function tests.login(p_email text) returns void language plpgsql as $$
begin
  reset role;
  perform set_config('request.jwt.claim.sub', (select id::text from auth.users where email = p_email), true);
  perform set_config('role', 'authenticated', true);
end;
$$;

create function tests.anon() returns void language plpgsql as $$
begin
  reset role;
  perform set_config('request.jwt.claim.sub', '', true);
  perform set_config('role', 'anon', true);
end;
$$;

insert into auth.users (email, raw_user_meta_data) values
  ('adv@test', '{"role": "advertiser"}'),
  ('adv2@test', '{"role": "advertiser"}'),
  ('vis@test', '{"role": "visitor", "display_name": "Sam"}'),
  ('vis2@test', '{}'),
  ('mod@test', '{"role": "moderator"}');

select tests.ok((select role from public.accounts a join auth.users u using (id) where u.email = 'mod@test') = 'visitor',
  'sign-up metadata cannot make someone a moderator');
update public.accounts set role = 'moderator' where id = (select id from auth.users where email = 'mod@test');

create temp table ids as
select
  (select id from auth.users where email = 'adv@test') as adv,
  (select id from auth.users where email = 'adv2@test') as adv2,
  (select id from auth.users where email = 'vis@test') as vis,
  (select id from auth.users where email = 'vis2@test') as vis2;
grant select on ids to anon, authenticated, service_role;

-- Listings -------------------------------------------------------------------

select tests.login('vis@test');
select tests.throws($$insert into public.listings (slug, display_name, age, area) values ('sneaky', 'S', 30, 'Leeds')$$,
  'visitors cannot create listings');

select tests.login('adv@test');
insert into public.listings (slug, display_name, age, area, approx_lat, approx_lng, tags)
values ('helen', 'Helen', 23, 'Shoreditch, London', 51.52678, -0.07812, '[{"emoji":"🎬","label":"Movie buff"}]');
select tests.ok((select approx_lat from public.listings where slug = 'helen') = 51.53, 'location is rounded to about 1 km');
select tests.throws($$update public.listings set status = 'published'$$, 'advertisers cannot publish themselves');
select tests.throws($$insert into public.listings (slug, display_name, age, area) values ('helen2', 'H', 23, 'Leeds')$$,
  'only one listing per advertiser');

select tests.anon();
select tests.ok(tests.count('select * from public.listings') = 0, 'drafts are hidden from the public');

select tests.login('adv@test');
select tests.throws('select public.submit_listing_for_review()', 'cannot submit before agreeing to the statements');
select tests.throws($$select public.give_consents(array['adult'])$$, 'a partial set of consents is refused');
select public.give_consents(array(select key from public.consent_statements where version = 1));
select tests.ok((select consents_done and not checkin_done from public.my_onboarding()), 'consents recorded, check-in still to do');
select tests.throws('select public.submit_listing_for_review()', 'cannot submit before the safety check-in');
select public.submit_safety_checkin('no', 'yes', false);
select tests.ok(tests.count('select * from public.safety_checkins') = 0, 'advertisers cannot read check-in answers back');
select tests.throws('select public.submit_listing_for_review()', 'cannot submit without photos');

create temp table l as select id from public.listings where slug = 'helen';
grant select on l to anon, authenticated, service_role;

insert into public.listing_photos (listing_id, storage_path, position, is_locked)
select id, id || '/1.jpg', 0, false from l union all
select id, id || '/2.jpg', 1, true from l;
insert into storage.objects (bucket_id, name) select 'listing-photos', id || '/1.jpg' from l;
select tests.throws($$insert into storage.objects (bucket_id, name) values ('listing-photos', gen_random_uuid() || '/x.jpg')$$,
  'cannot upload into someone else''s folder');
select tests.throws($$insert into public.listing_photos (listing_id, storage_path) select id, 'elsewhere/1.jpg' from l$$,
  'photo path must sit in the listing folder');
select public.submit_listing_for_review();

-- Moderation and verification -------------------------------------------------

select tests.login('mod@test');
select tests.throws($$select public.review_listing((select id from l), true)$$, 'cannot approve before ID verification');

reset role;
set local role service_role;
select tests.throws($$select 1 from public.complete_verification_check(gen_random_uuid(), true)$$, 'unknown check id is rejected');
select public.complete_verification_check(
  public.begin_verification_check((select adv from ids), 'id_verification', 'stub'), true, 'ref-1', '1999-03-01');
reset role;

select tests.ok((select id_verification = 'passed' and age_assurance = 'passed' from public.accounts where id = (select adv from ids)),
  'passing an ID check also counts as age assurance');
select tests.ok((select age from public.listings where slug = 'helen') = extract(year from age(current_date, '1999-03-01'::date)),
  'listing age is corrected to the verified date of birth');

select tests.login('adv@test');
select tests.throws($$update public.listings set age = 19 where slug = 'helen'$$, 'cannot claim an age that differs from the ID check');

select tests.login('vis@test');
select tests.throws($$select public.review_photo((select id from public.listing_photos limit 1), true)$$, 'visitors cannot moderate');

select tests.login('mod@test');
select public.review_photo(id, true) from public.listing_photos;
select public.review_listing((select id from l), true, 'Looks good');

select tests.anon();
select tests.ok(tests.count('select * from public.listings') = 1, 'approved listing is public');
select tests.ok(tests.count('select * from public.listing_photos') = 1, 'public sees only the unlocked photo');
select tests.ok((select locked_photo_count from public.listings) = 1, 'locked photo count is still shown');
select tests.ok(tests.count('select * from storage.objects') = 1, 'public can fetch the approved photo file');

select tests.login('vis2@test');
select tests.ok(tests.count('select * from public.listing_photos') = 1, 'not age-assured visitor cannot see locked photos');

-- Unlocking a photo sends it back to review.
select tests.login('adv@test');
update public.listing_photos set is_locked = false where position = 1;
select tests.ok((select status from public.listing_photos where position = 1) = 'pending', 'unlocking a photo needs re-approval');
update public.listing_photos set is_locked = true where position = 1;
update public.listings set bio = 'New bio' where slug = 'helen';
select tests.ok((select status = 'published' and needs_review from public.listings), 'edits to a live listing stay live but are re-queued');

select tests.login('mod@test');
select public.review_photo(id, true) from public.listing_photos where status = 'pending';

-- Shortlist ------------------------------------------------------------------

select tests.login('vis@test');
insert into public.shortlist (listing_id) select id from l;
select tests.ok(tests.count('select * from public.shortlist') = 1, 'visitor can shortlist');
select tests.login('vis2@test');
select tests.ok(tests.count('select * from public.shortlist') = 0, 'shortlists are private');

-- Chat -----------------------------------------------------------------------

select tests.login('vis@test');
select tests.throws($$select public.start_conversation((select id from l))$$, 'age check needed before messaging');

reset role;
set local role service_role;
select public.complete_verification_check(
  public.begin_verification_check((select vis from ids), 'age_assurance', 'stub'), true);
reset role;

select tests.login('vis@test');
select tests.ok(tests.count('select * from public.listing_photos') = 2, 'age-assured visitor sees the locked photo');
select tests.login('vis2@test');
select tests.ok(tests.count('select * from public.listing_photos') = 1, 'other visitors still cannot');
select tests.login('vis@test');
create temp table c as select public.start_conversation((select id from l)) as id;
grant select on c to anon, authenticated, service_role;
select tests.ok((select public.start_conversation((select id from l))) = (select id from c), 'starting again returns the same conversation');
insert into public.messages (conversation_id, body) select id, 'Hi, are you free Friday?' from c;
select tests.throws($$insert into public.messages (conversation_id, sender_id, body) select id, (select adv from ids), 'spoof' from c$$,
  'cannot send as someone else');

select tests.login('adv@test');
select tests.throws($$select public.start_conversation((select id from l))$$, 'advertisers cannot cold-message');
select tests.ok(tests.count('select * from public.messages') = 1, 'advertiser reads the message');
select tests.ok((select unread_count from public.my_conversations()) = 1, 'inbox shows 1 unread');
select tests.ok((select partner_name from public.my_conversations()) = 'Sam', 'advertiser sees the visitor''s display name');
select public.mark_conversation_read((select id from c));
select tests.ok((select unread_count from public.my_conversations()) = 0, 'mark read clears unread');
insert into public.messages (conversation_id, body) select id, 'Yes, after 7' from c;

select tests.login('vis2@test');
select tests.ok(tests.count('select * from public.messages') = 0, 'outsiders cannot read the chat');
select tests.throws($$insert into public.messages (conversation_id, body) select id, 'hey' from c$$, 'outsiders cannot post into the chat');

select tests.login('mod@test');
select tests.ok(tests.count('select * from public.messages') = 0, 'moderators cannot read unreported chats');

select tests.login('vis@test');
select tests.ok((select partner_name from public.my_conversations()) = 'Helen', 'visitor sees the listing name');
select tests.ok(public.submit_report('harassment', 'rude', p_message_id => (select max(id) from public.messages)) is not null,
  'visitor can report a message');

select tests.login('mod@test');
select tests.ok(tests.count('select * from public.messages') = 2, 'moderators can read a reported chat');
select tests.ok(tests.count('select * from public.reports where status = ''open''') = 1, 'report is in the queue');
select public.resolve_report((select id from public.reports limit 1), 'dismissed', 'Normal reply');

select tests.login('adv@test');
insert into public.blocks (blocked_id) select vis from ids;
select tests.login('vis@test');
select tests.throws($$insert into public.messages (conversation_id, body) select id, 'hello?' from c$$, 'blocked visitor cannot send');
select tests.ok((select blocked from public.my_conversations()), 'inbox shows the conversation as blocked');

select tests.login('adv@test');
delete from public.blocks;
select tests.throws($$insert into public.messages (conversation_id, body) select id, 'flood' from c, generate_series(1, 25)$$,
  'message flood is rate limited');

-- Reports from the public ------------------------------------------------------

select tests.anon();
select tests.ok(public.submit_report('underage', 'Looks young', p_listing_id => (select id from l)) is not null,
  'anyone can report a listing without an account');
select tests.throws('select * from public.reports', 'the public cannot read reports');

-- Under-18 ID check ----------------------------------------------------------

select tests.login('adv2@test');
insert into public.listings (slug, display_name, age, area) values ('kid', 'K', 19, 'Leeds');
reset role;
set local role service_role;
select public.complete_verification_check(
  public.begin_verification_check((select adv2 from ids), 'id_verification', 'stub'), true, 'ref-2', (current_date - interval '16 years')::date);
reset role;
select tests.ok((select id_verification = 'failed' from public.accounts where id = (select adv2 from ids)), 'under-18 ID check fails');
select tests.ok((select status = 'suspended' from public.listings where slug = 'kid'), 'under-18 listing is suspended');
select tests.ok(exists (select 1 from public.reports where urgent and reported_account_id = (select adv2 from ids)),
  'under-18 result raises an urgent report');

-- Onboarding risk flags ------------------------------------------------------

select tests.login('vis@test');
select tests.throws($$select public.give_consents(array(select key from public.consent_statements))$$,
  'visitors cannot give advertiser consents');

reset role;
insert into auth.users (email, raw_user_meta_data) values
  ('adv3@test', '{"role": "advertiser"}'),
  ('adv4@test', '{"role": "advertiser"}'),
  ('adv5@test', '{"role": "advertiser"}');
create temp table more_ids as
select
  (select id from auth.users where email = 'adv3@test') as adv3,
  (select id from auth.users where email = 'adv4@test') as adv4,
  (select id from auth.users where email = 'adv5@test') as adv5;
grant select on more_ids to anon, authenticated, service_role;

set local role service_role;
select public.record_account_signal((select adv3 from more_ids), 'phone', repeat('a', 64));
select public.record_account_signal((select adv4 from more_ids), 'phone', repeat('a', 64));
select public.record_account_signal((select vis from ids), 'phone', repeat('a', 64));
reset role;
select tests.ok((select count(*) from public.risk_flags where kind = 'shared_phone' and severity = 'review') = 2,
  'two advertisers sharing a phone are both flagged, visitors are ignored');

set local role service_role;
select public.record_account_signal((select adv5 from more_ids), 'phone', repeat('a', 64));
reset role;
select tests.ok((select count(*) from public.risk_flags where kind = 'shared_phone' and severity = 'urgent') = 4,
  'a third account on the same phone is urgent');
select tests.ok(exists (select 1 from public.reports where urgent and reported_account_id = (select adv5 from more_ids)),
  'urgent flags go into the urgent reports queue');

select tests.login('adv3@test');
select public.submit_safety_checkin('yes', 'yes', false);
reset role;
select tests.ok(exists (
  select 1 from public.risk_flags
  where account_id = (select adv3 from more_ids) and kind = 'safety_checkin' and severity = 'urgent'
), 'saying someone else is involved raises an urgent flag');

select tests.login('adv4@test');
insert into public.listings (slug, display_name, age, area, bio) values ('ana', 'Ana', 24, 'Leeds', 'Ask our booker. New girls every week');
reset role;
select tests.ok((select detail from public.risk_flags where account_id = (select adv4 from more_ids) and kind = 'profile_wording')
  like '%booker%', 'profile wording that suggests a third party is flagged');

set local role service_role;
select public.complete_verification_check(
  public.begin_verification_check((select adv5 from more_ids), 'id_verification', 'stub'), false, null, null, 'face_mismatch')
from generate_series(1, 3);
reset role;
select tests.ok(exists (
  select 1 from public.risk_flags where account_id = (select adv5 from more_ids) and kind = 'repeated_id_failures'
), 'three failed ID checks raise a flag');

select tests.login('adv3@test');
select tests.ok(tests.count('select * from public.risk_flags') = 0, 'advertisers never see flags, even their own');
select tests.throws('select * from public.account_signals', 'advertisers cannot read signals');
select tests.throws($$select public.raise_risk_flag((select adv3 from more_ids), 'shared_phone', 'review', 'x')$$,
  'users cannot raise flags');
select tests.throws($$select public.record_account_signal((select adv3 from more_ids), 'phone', repeat('b', 64))$$,
  'users cannot record signals');
select tests.throws($$select public.resolve_risk_flag(1, 'cleared')$$, 'advertisers cannot clear flags');

select tests.login('mod@test');
select tests.ok(tests.count('select * from public.risk_flags') = 9, 'moderators see every flag');
select tests.ok(tests.count('select * from public.safety_checkins') = 2, 'moderators read check-in answers');
select public.resolve_risk_flag((select id from public.risk_flags where kind = 'profile_wording'), 'cleared', 'Checked, fine');
select tests.ok((select status from public.risk_flags where kind = 'profile_wording') = 'cleared', 'moderators can clear a flag');

-- Bans -----------------------------------------------------------------------

select tests.login('mod@test');
select public.set_account_ban((select adv from ids), true, 'Test ban');
select tests.anon();
select tests.ok(tests.count('select * from public.listings') = 0, 'banned advertiser''s listing disappears');
select tests.login('adv@test');
with u as (update public.listings set bio = 'x' returning 1)
select tests.ok(count(*) = 0, 'banned advertiser cannot edit') from u;

reset role;
select tests.ok((select count(*) from public.moderation_log) >= 5, 'moderator actions are logged');

rollback;
