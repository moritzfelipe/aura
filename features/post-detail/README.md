# Post Detail Feature

The post detail feature powers the `/post/[id]` route. It reuses the shared dataset to render the full body, metadata, and tipping loop for a single post.

## Structure

- `components/PostDetailView.tsx` – Client component that orchestrates the layout, renders markdown, and handles tipping.
- `post-detail.module.css` – Styles scoped to the detail view.

## Data Flow

1. The route loader (`app/post/[id]/page.tsx`) uses `getMockPosts()` to retrieve the dataset and passes the matching post plus a small list of related entries.
2. `PostDetailView` hydrates a local tip counter and reuses `useLocalStorageTips()` to keep personalization state aligned with the feed.
3. The markdown body is rendered with `react-markdown` so you can author rich copy in `data/db.json`.
4. The related section lists up to three other posts, highlighting entries already tipped by the reader.

## Editing Tips

Tip counts are optimistic and purely local during Phase 1. Refreshing the page resets them to whatever value is stored in `data/db.json`. This keeps the UX fast while matching the roadmap specification.
