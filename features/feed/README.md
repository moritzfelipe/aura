# Feed Feature

Phase 2 swaps the local JSON dataset for real posts minted through the AuraPost contract. This directory groups the React components, hooks, and data helpers that back the `/` route.

## Structure

- `components/FeedView.tsx` – Client wrapper that wires personalization, renders controls, and delegates rendering to the list.
- `components/PostList.tsx` – Grid list of post cards with tipping affordances.
- `post-card.module.css` / `feed.module.css` – Styles scoped to the feed components.
- `hooks/usePersonalizedFeed.ts` – Client hook that maintains post state, applies personalization order, and handles tip side-effects.
- `data/getAuraPosts.ts` – Server helper that reads on-chain data with `viem` and dereferences metadata from IPFS.
- `types.ts` – Shared types for posts and personalization metadata.

## Behaviour

1. `getAuraPosts()` connects to the configured `AURA_POST_ADDRESS`, fetches `totalSupply`, and loops through each token ID.
2. For every token it reads `ownerOf`, `tokenURI`, and `contentHashOf`, downloads the metadata JSON (via IPFS gateway), and normalises it into the `FeedPost` shape.
3. `FeedView` bootstraps the `usePersonalizedFeed` hook with that list and renders the personalization toggle.
4. Tipping updates the local list immediately and registers the post in `localStorage` for future sessions. Ordering favours items you tipped when personalization is enabled.

## Configuration

Set the following environment variables (see `.env.example`):

- `AURA_RPC_URL` – HTTPS RPC endpoint for the chain (Sepolia by default).
- `AURA_POST_ADDRESS` – Deployed AuraPost contract address.
- `AURA_CHAIN_ID` (optional) – Override chain ID if not Sepolia.
- `AURA_IPFS_GATEWAY` / `NEXT_PUBLIC_AURA_IPFS_GATEWAY` (optional) – Custom IPFS gateway base URL.

Restart `npm run dev` after changing environment variables. Minting a new post on-chain automatically surfaces it in the feed after the next revalidation cycle (30 seconds by default).
