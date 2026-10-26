-- Profile links share the /profile/<slug> namespace with app routes such as
-- /profile/me, so keep those words out of listing slugs.

alter table public.listings add constraint listings_slug_not_reserved
  check (slug not in ('me', 'new', 'edit', 'admin', 'moderation', 'settings', 'help', 'support', 'shroom'));
