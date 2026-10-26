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

App code:

- `src/lib/supabase/`: browser, server and secret-key clients, session middleware, generated types
- `src/lib/data/`: listings (mapped to the existing `Profile` type), shortlist, chat (with realtime), photo upload
- `src/lib/verification/`: provider interface, plus a `stub` provider for now. Yoti and VerifyMy are placeholders until there's a contract.
- Pages: `/sign-up`, `/sign-in`, `/advertise` (profile editor, photos, ID check), `/moderation`, `/verify/stub` (test-only stand-in for the provider)
- API: `POST /api/verification/start`, `POST /api/verification/webhook/[provider]`

Until `NEXT_PUBLIC_SUPABASE_URL` is set, the existing screens keep running on mock data.

## Setting up a Supabase project

1. Copy `.env.example` to `.env.local` and fill it in.
2. `npx supabase link --project-ref <ref>`, then `npx supabase db push` to apply the migrations.
3. Under Auth → URL Configuration, set the site URL, and add `<site>/auth/confirm` as a redirect URL.
4. Make yourself a moderator in the SQL editor:
   `update accounts set role = 'admin' where id = (select id from auth.users where email = 'you@…');`
5. After any schema change, run `npm run db:types`.

## Testing the access rules

`supabase/rls-tests` holds 54 checks that cover the rules above. They run against
any plain Postgres, with no Docker needed:

```
DATABASE_URL=postgresql://postgres@localhost:5432/postgres npm run db:test
```

## Not built yet

- Real Yoti / VerifyMy integrations (the adapters are in `src/lib/verification/providers.ts`)
- Stories, featured slots and subscriptions (billing)
- Account deletion and data export (GDPR)
- Image moderation AI and CSAM hash matching (e.g. IWF hash list) ahead of human review
