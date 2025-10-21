# On-Chain Data Flow

Phase 2 replaces the local JSON feed with posts pulled directly from the `AuraPost` contract.

## Environment

Create a `.env.local` (or similar) with the following keys:

```
AURA_RPC_URL=https://sepolia.infura.io/v3/<key>
AURA_POST_ADDRESS=0xD14295DC49cC7191C077c37be5392888C380b6cB
AURA_CHAIN_ID=11155111
AURA_IPFS_GATEWAY=https://ipfs.io/ipfs/
NEXT_PUBLIC_AURA_IPFS_GATEWAY=https://ipfs.io/ipfs/
```

- `AURA_RPC_URL` – HTTPS RPC endpoint.
- `AURA_POST_ADDRESS` – Deployed AuraPost contract (update when redeploying).
- `AURA_CHAIN_ID` – Optional override (defaults to Sepolia `11155111`).
- `AURA_IPFS_GATEWAY` – Server-side gateway for fetching metadata.
- `NEXT_PUBLIC_AURA_IPFS_GATEWAY` – Client-side gateway for detail links.

Restart the dev server after changing any of these values.

## Fetch Sequence

1. `getAuraPosts()` reads `totalSupply()` and loops from `1` through the returned value.
2. For each `tokenId`, the app requests `ownerOf`, `tokenURI`, and `contentHashOf` from the contract.
3. The metadata JSON pointed to by `tokenURI` is loaded via the configured IPFS gateway.
4. Metadata is normalized into the `FeedPost` shape, ensuring we always have `title`, `summary`, `body`, `tags`, and `createdAt` values (with sensible fallbacks).
5. The feed orders posts by `createdAt` (descending). Personalization still works via `localStorage`.

## Adding New Posts

1. Prepare metadata (`contracts/aura-post/examples/sample-post.json` is a template).
2. Upload the JSON to IPFS and capture both the CID (`tokenURI`) and its keccak256 hash (`contentHash`).
3. Call `publish(tokenURI, contentHash)` in Remix using the deployed contract.
4. The post appears in the feed once the ISR window (30 seconds by default) passes or after a manual reload while running locally.

## Troubleshooting

- If the feed shows an error banner, verify RPC URL, contract address, and that the contract has at least one minted post.
- Metadata fetch failures are logged to the console and skipped, preventing a single bad IPFS object from breaking the feed.
- Adjust `AURA_IPFS_GATEWAY` if you prefer a custom Pinata gateway or a local IPFS daemon.
