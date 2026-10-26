# shroom web app

Mobile-first Next.js app for the verified UK directory. Phase 1 UI only: data is mocked in `src/lib/mock-data.ts`.

```bash
npm install
npm run dev
```

## Screens

| Route | Screen |
| --- | --- |
| `/` | For You card stack (swipe right or tap the heart to save) |
| `/nearby` | Map of nearby profiles (area-level, fuzzed positions) |
| `/explore` | Grid with removable filter chips |
| `/saved` | Saved profiles |
| `/profile/[id]` | Profile: photos, locked 18+ tile, about, tags |
| `/stories/[id]` | Story viewer with reply box |
| `/messages` | Inbox with story rail |
| `/messages/[id]` | Conversation |
| `/me` | My listing: the advertiser's own profile as visitors see it |
| `/me/edit` | Listing editor: details, tags, photos (cover, order, 18+ lock), story |

## Theming

All colours are tokens in `src/app/globals.css`. Change the `:root` block to rebrand.

## Placeholder photos

`public/photos` holds mood/lifestyle stock shots (Unsplash licence, fetched via picsum.photos) standing in for verified advertiser uploads. They are wired up in `src/lib/mock-data.ts`; swap each `src` for a real upload URL.

## Working locally (no backend yet)

Everything below runs on client state, so it resets on reload unless noted:

- Photo gallery: tap the profile hero or any thumbnail (swipe, arrow keys, Esc)
- 18+ tile: age confirmation and access request
- Search (name, area, bio, tags) and filters (age range, distance, area, interests, available now, ID verified, has photos, has 18+ content, sort) shared by For You, Nearby and Explore; saved to `localStorage`
- Saved searches: name the current search in the filter sheet, re-apply it there or from the ☰ menu
- My listing (`src/lib/my-listing.tsx`): a local store shaped like the backend's `listings` / `listing_photos` rows, with the same limits. Swap `save` for `saveListing` + `uploadListingPhoto` when Supabase is on
- Card options: view, share/copy link, not interested, report; bookmark saves
- Side menu: navigation, safety tips, reset filters, clear saved
- Map recentre selects the nearest profile
- Chat: attach a photo, mute, block/unblock, report; inbox search

## Not wired yet

- API, auth and real uploads (reports, access requests and blocks don't leave the browser)
- Real map tiles (`MapBackdrop` is a placeholder for MapLibre)
- Realtime chat backend, block and report actions
