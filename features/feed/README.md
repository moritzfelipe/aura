# Feed Feature

Phase 1 focuses on a local-first mock of the curator feed. This directory groups the React components, hooks, and data helpers that back the `/` route.

## Structure

- `components/FeedView.tsx` – Client wrapper that wires personalization, renders controls, and delegates rendering to the list.
- `components/PostList.tsx` – Grid list of post cards with tipping affordances.
- `post-card.module.css` / `feed.module.css` – Styles scoped to the feed components.
- `hooks/usePersonalizedFeed.ts` – Client hook that maintains post state, applies personalization order, and handles tip side-effects.
- `data/getMockPosts.ts` – Server helper that loads and normalizes the local JSON dataset.
- `types.ts` – Shared types for posts and personalization metadata.

## Behaviour

1. `getMockPosts()` reads `data/db.json`, normalizes timestamps, and returns posts sorted by recency.
2. `FeedView` bootstraps the `usePersonalizedFeed` hook with that list and renders the personalization toggle.
3. Tipping updates the local list immediately and registers the post in `localStorage` for future sessions.
4. When personalization is enabled, the hook reorders posts so tipped entries float to the top (ties resolved by tip count then recency).

## Editing The Dataset

Update `data/db.json` to add, remove, or tweak posts. Each entry follows the `MockPost` shape:

```json
{
  "id": "unique-slug",
  "title": "Readable title",
  "summary": "Short card summary.",
  "body": "Markdown body rendered on the post page.",
  "creatorAddress": "0xcreator...",
  "tips": 0,
  "tbaAddress": "0xtba...",
  "createdAt": "2024-10-18T15:32:00.000Z",
  "coverImageUrl": "https://optional-image",
  "tags": ["tag-one", "tag-two"]
}
```

Changes hot-reload automatically during `npm run dev`; no additional scripts are required.
