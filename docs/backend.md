# Backend

Supabase: Postgres, auth, storage and realtime chat. The schema lives in
`supabase/migrations`, and every access rule is enforced in the database with
row-level security, so the browser can talk to Supabase directly and still
only see what it should.

## What's in it

| Area | Tables / functions | Rules |
| --- | --- | --- |
| Accounts | `accounts` (one per auth user) | Visitor or advertiser at sign-up. Moderators and admins are set by hand. Users can only change their display name. |
| Profiles | `listings` | One per advertiser. Draft → review → published. Advertisers can't publish themselves. Location is rounded to about 1 km. Edits to a live profile stay live but go back in the queue. Age must match the ID check. |
| Photos | `listing_photos`, bucket `listing-photos` (private) | Hidden until a moderator approves each one. Locked photos are only for age-checked visitors. Unlocking a photo sends it back to review. GPS and other metadata are removed in the browser before upload. |
| Shortlist | `shortlist` | Private to each user. |
| Chat | `conversations`, `messages`, `blocks`, `start_conversation()`, `my_conversations()`, `mark_conversation_read()` | Only age-checked visitors can start a chat, and advertisers can't cold-message. Only the two people involved can read it, unless it's reported. Blocking stops messages both ways. Limit of 20 messages a minute. Realtime goes through `postgres_changes` on `messages`. |
| Reports | `reports`, `submit_report()` | Anyone, signed in or not, can report a profile or photo. Participants can report a message. Under-18 and coercion reports are marked urgent. |
| Moderation | `moderation_log`, `review_listing()`, `review_photo()`, `resolve_report()`, `set_account_ban()` | Moderator only, and every action is logged. A ban takes the profile down. |
| Verification | `verification_checks`, `begin_verification_check()`, `complete_verification_check()` | Written only by the server. An ID check (advertisers) also counts as an age check. An under-18 result suspends the profile and files an urgent report. No documents are stored. |
| Onboarding | `consent_statements`, `consents`, `give_consents()`, `safety_checkins`, `submit_safety_checkin()`, `my_onboarding()` | An advertiser can't send a profile for review until they've agreed to the current statements and answered the safety check-in. A worrying answer raises a risk flag. Check-in answers are only visible to moderators. |
| Risk flags | `risk_flags`, `account_signals`, `raise_risk_flag()`, `record_account_signal()`, `resolve_risk_flag()` | Raised automatically: a phone, device or (once billing exists) payment card shared between advertisers (3+ accounts is urgent), 3 failed ID checks, agency-style wording in a profile, or a check-in answer. Signals are stored as keyed hashes and nobody can read them. Moderators clear or action each flag, and that's logged. An urgent flag also files a coercion report. |

App code:

- `src/lib/supabase/`: browser, server and secret-key clients, session middleware, generated types
- `src/lib/data/`: listings (mapped to the existing `Profile` type), shortlist, chat (with realtime), photo upload
- `src/lib/verification/`: provider interface, a `stub` provider, Yoti (advertiser ID: document, liveness and face match, camera only) and VerifyMy (visitor age checks). Results come by webhook, and are also fetched directly when the person comes back, so local development works without webhooks. Yoti sessions are deleted once the result is stored.
- `src/lib/onboarding/`: phone and device signals, hashed with `SIGNAL_HASH_SECRET`
- Pages: `/sign-up`, `/sign-in`, `/onboarding` (the advertiser's step-by-step setup), `/advertise` (profile editor, photos, ID check), `/moderation` (profiles, photos, reports, risk flags), `/verify/yoti` (Yoti's capture screens in a frame), `/verify/stub` (test-only stand-in for the provider)
- API: `POST /api/verification/start`, `POST /api/verification/webhook/[provider]`, `GET /api/verification/return/[provider]`

Until `NEXT_PUBLIC_SUPABASE_URL` is set, the existing screens keep running on mock data.

## Setting up a Supabase project

1. Copy `.env.example` to `.env.local` and fill it in.
2. `npx supabase link --project-ref <ref>`, then `npx supabase db push` to apply the migrations.
3. Under Auth → URL Configuration, set the site URL, and add `<site>/auth/confirm` as a redirect URL.
4. Make yourself a moderator in the SQL editor:
   `update accounts set role = 'admin' where id = (select id from auth.users where email = 'you@…');`
5. After any schema change, run `npm run db:types`.

## Verification providers

Set `ID_VERIFICATION_PROVIDER=yoti` and `AGE_ASSURANCE_PROVIDER=verifymy` once the keys are in `.env.local`.

- **Yoti** (Identity Verification, from the Yoti Hub): `YOTI_CLIENT_SDK_ID`, plus the private key as `YOTI_KEY_FILE_PATH` locally or `YOTI_PEM` on the host. For the sandbox, set `YOTI_IDV_API_URL=https://api.yoti.com/sandbox/idverify/v1`. The webhook needs HTTPS and `VERIFICATION_WEBHOOK_SECRET`.
- **VerifyMy** (age verification): `VERIFYMY_API_KEY`, `VERIFYMY_API_SECRET`, and optionally `VERIFYMY_BUSINESS_SETTINGS_ID`. Register `<site>/api/verification/return/verifymy` as a redirect URL in their dashboard. For the sandbox, set `VERIFYMY_API_URL=https://sandbox.verifymyage.com`.

## Testing the access rules

`supabase/rls-tests` holds 72 checks that cover the rules above. They run against
any plain Postgres, with no Docker needed:

```
DATABASE_URL=postgresql://postgres@localhost:5432/postgres npm run db:test
```

## Not built yet

- Stories, featured slots and subscriptions (billing)
- Account deletion and data export (GDPR)
- Image moderation AI and CSAM hash matching (e.g. IWF hash list) ahead of human review
