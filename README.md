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

## Theming

All colours are tokens in `src/app/globals.css`. Change the `:root` block to rebrand.

## Not wired yet

- API, auth and real photos (`PhotoFill` shows a gradient until `src` is set)
- Real map tiles (`MapBackdrop` is a placeholder for MapLibre)
- Realtime chat backend, block and report actions
