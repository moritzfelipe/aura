# Feed Feature

Phase 2 swaps the local JSON dataset for real posts minted through the Valeu post contract (`ValeuPost.sol`). This directory groups the React components, hooks, and data helpers that back the `/` route.

## Structure

- `components/FeedView.tsx` – Client wrapper that wires personalization, renders the header controls, and delegates to the timeline renderer.
- `components/PostList.tsx` – Single-column timeline that supports inline expansion, media previews, and the refreshed tip composer.
- `timeline.module.css` / `feed.module.css` – Styles scoped to the timeline and header controls.
- `hooks/usePersonalizedFeed.ts` – Client hook that maintains post state, applies personalization order, and handles tip side-effects.
- `data/getValeuPosts.ts` – Server helper that reads on-chain data with `viem` and dereferences metadata from IPFS.
- `types.ts` – Shared types for posts, tipping payloads, and personalization metadata.

## Behaviour

1. `getValeuPosts()` connects to the configured `VALEU_POST_ADDRESS`, fetches `totalSupply`, and loops through each token ID.
2. For every token it reads `ownerOf`, `tokenURI`, and `contentHashOf`, resolves the deterministic ERC-6551 account via the registry, downloads the metadata JSON (via IPFS gateway), and normalises it into the `FeedPost` shape (including `tbaAddress`).
3. `FeedView` bootstraps `usePersonalizedFeed` with that list, renders the personalization toggle, and hands control to `PostList`.
4. `PostList` renders each post as a compact card; clicking expands it inline with full markdown, on-chain metadata, and the image preview.
5. The refreshed `TipButton` lets users build a tip by repeatedly clicking across the button (left adds a small increment, right adds a larger bump), shows the pending amount in a compact display pill with an inline edit affordance, and sends automatically after a short pause in interaction.

## Configuration

Set the following environment variables (see `.env.local`):

- `VALEU_RPC_URL` – HTTPS RPC endpoint for the chain (Sepolia by default).
- `VALEU_POST_ADDRESS` – Deployed Valeu post contract address.
- `VALEU_CHAIN_ID` (optional) – Override chain ID if not Sepolia.
- `VALEU_ACCOUNT_IMPLEMENTATION` – ERC-6551 account implementation address.
- `VALEU_ERC6551_REGISTRY` – Registry used to derive token-bound accounts.
- `VALEU_IPFS_GATEWAY` / `NEXT_PUBLIC_VALEU_IPFS_GATEWAY` (optional) – Custom IPFS gateway base URL.
- `NEXT_PUBLIC_VALEU_CHAIN_ID` (optional) – Client hint used to request a wallet network switch.

Restart `npm run dev` after changing environment variables. Minting a new post on-chain automatically surfaces it in the feed after the next revalidation cycle (30 seconds by default).
