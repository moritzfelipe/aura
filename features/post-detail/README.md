# Post Detail Feature

The post detail feature powers the `/post/[id]` route. It renders on-chain Aura posts (fetched via `getAuraPosts()`) and keeps the local tipping loop.

## Structure

- `components/PostDetailView.tsx` – Client component that orchestrates the layout, renders markdown, and handles tipping.
- `post-detail.module.css` – Styles scoped to the detail view.

## Data Flow

1. The route loader (`app/post/[id]/page.tsx`) calls `getAuraPosts()` to fetch the current list of minted posts, selects the requested token ID, and passes the rest as related entries.
2. `PostDetailView` hydrates a local tip counter and reuses `useLocalStorageTips()` to keep personalization state aligned with the feed.
3. The markdown body is rendered with `react-markdown` so post metadata authored in IPFS JSON shows up nicely.
4. The "On-chain Details" section exposes the token URI (gateway link) and `contentHash` alongside wallet metadata.

## Editing Tips

Tip counts remain optimistic and purely local during Phase 2. Refreshing the page resets them to zero (unless already tipped in the current browser). We'll hook into real on-chain signals in Phase 3.
