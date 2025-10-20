# Mock Data Guide

Phase 1 uses a local JSON file (`data/db.json`) to mimic the curator feed until on-chain data is available. Keep the following in mind when editing the dataset:

## Schema

| Field | Type | Notes |
| --- | --- | --- |
| `id` | `string` | Unique slug used for routing (`/post/[id]`). |
| `title` | `string` | Display title for cards and detail view. |
| `summary` | `string` | Short copy rendered on the feed. |
| `body` | `string` | Markdown body rendered with `react-markdown`. |
| `creatorAddress` | `string` | Fake checksum-style address for attribution. |
| `tips` | `number` | Initial tip count shown before local personalization. |
| `tbaAddress` | `string` | Placeholder token-bound account address. |
| `createdAt` | `ISO string` | Used for chronological ordering when personalization is off. |
| `coverImageUrl` | `string?` | Optional hero image URL for cards and detail view. |
| `tags` | `string[]` | Rendered as badges and used for related content filtering. |

## Editing Workflow

1. Run `npm run dev` to start the Next.js server.
2. Update `data/db.json` with new or revised posts.
3. The feed hot-reloads automatically; hard refresh if you change slug IDs to bust the Next.js cache.

## Tips

- Keep `createdAt` values unique to avoid ambiguous ordering.
- Use compressed remote images (Unsplash, etc.) for `coverImageUrl` or omit the field.
- When adding markdown in `body`, prefer headings (`##`/`###`) and lists to keep the layout clean.
- Because tips are simulated, choose small integers that roughly match the importance you want to convey.
