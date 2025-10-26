# Post Detail Feature

The post detail feature powers the `/post/[id]` route. It now reuses the same inline timeline experience as the home feed, automatically expanding the requested post inside the stream so readers never leave context.

## Structure

- `app/post/[id]/page.tsx` – Server component that loads Valeu posts via `getValeuPosts()` and renders the shared `FeedView` with the requested `tokenId` pre-expanded.
- Shared UI and tipping interactions live alongside the feed feature (`features/feed/components/PostList.tsx`, `TipButton.tsx`).

## Behaviour

1. The route fetches the full post list, verifies the requested `tokenId` exists, and passes it to `FeedView` through the `initialExpandedId` prop.
2. `FeedView` hydrates client state (personalization + tipping) and renders the same timeline used on `/`, with the target post opened in place.
3. Collapsing the post returns to the compact card view; tipping and personalization remain fully local just like the homepage.

## Editing Tips

- Keep permalink-specific logic minimal inside `app/post/[id]/page.tsx`; any UI changes should be implemented in the feed components so both routes stay in sync.
- When adding new detail affordances (e.g., share CTA, comments), wire them into the timeline item so the inline experience remains consistent everywhere.
