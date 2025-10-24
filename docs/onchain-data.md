# On-Chain Data Flow

Phase 2 replaces the local JSON feed with posts pulled directly from the `AuraPost` contract.

## Environment

Create a `.env.local` (or similar) with the following keys:

```
AURA_RPC_URL=https://sepolia.infura.io/v3/<key>
AURA_POST_ADDRESS=0x94FC74A46E296814fFBb1D0a43b8778f5959cDE1
AURA_CHAIN_ID=11155111
AURA_ACCOUNT_IMPLEMENTATION=0xEb77bDb139319529210dE051eb932c5577e63f26
AURA_ERC6551_REGISTRY=0x02101dfB77FDE026414827Fdc604ddAF224F0921
AURA_IPFS_GATEWAY=https://ipfs.io/ipfs/
NEXT_PUBLIC_AURA_IPFS_GATEWAY=https://ipfs.io/ipfs/
NEXT_PUBLIC_AURA_CHAIN_ID=11155111
```

- `AURA_RPC_URL` – HTTPS RPC endpoint.
- `AURA_POST_ADDRESS` – Deployed AuraPost contract (update when redeploying).
- `AURA_CHAIN_ID` – Optional override (defaults to Sepolia `11155111`).
- `AURA_ACCOUNT_IMPLEMENTATION` – ERC-6551 account implementation cloned for each post.
- `AURA_ERC6551_REGISTRY` – Registry used to derive and deploy token-bound accounts (canonical Sepolia deployment).
- `AURA_IPFS_GATEWAY` – Server-side gateway for fetching metadata.
- `NEXT_PUBLIC_AURA_IPFS_GATEWAY` – Client-side gateway for detail links.
- `NEXT_PUBLIC_AURA_CHAIN_ID` – Client-side hint for wallet switching (defaults to Sepolia).

Restart the dev server after changing any of these values.

## Current Deployments

| Component | Network | Address | Block | Tx Hash | Notes |
| --- | --- | --- | --- | --- | --- |
| AuraPost (ERC-721) | Sepolia | `0x94FC74A46E296814fFBb1D0a43b8778f5959cDE1` | `9478256` | `0xd9a080e69604f8c1213a38ff97f1b89b34439b89a5d477b937f8f11d2c802a56` | Deployed via `DeployAuraPost.s.sol`. |
| AuraPostAccount (ERC-6551 implementation) | Sepolia | `0xEb77bDb139319529210dE051eb932c5577e63f26` | `9478363` | `0x62cadd6cd10595afdc3558db9ac387df510aeed8aa021c2e492057e54b8b0fbe` | `forge create` broadcast. |
| ERC-6551 Registry | Sepolia | `0x02101dfB77FDE026414827Fdc604ddAF224F0921` | — | Canonical | Official registry deployment recycled for all posts. |

Update this table whenever we redeploy so the team can keep track of live endpoints.

## Token-Bound Accounts

| Token ID | Account Address | createAccount Block | createAccount Tx | Last Tip Tx |
| --- | --- | --- | --- | --- |
| `1` | `0xe35bEc43474F04D24bD6B465A2E0578b31F10cAb` | `9478425` | `0x9a9912cf62ed5634156e4cfe25d54f58c034a064e501c80dfd74f1af433490c1` | `0xc77f11e25f9f276e51f413af7051d4e36634eb47c22e31100835a4d491d7d067` |

Tip balances can be checked with `cast balance <account> --rpc-url $AURA_RPC_URL`.

## Fetch Sequence

1. `getAuraPosts()` reads `totalSupply()` and loops from `1` through the returned value.
2. For each `tokenId`, the app requests `ownerOf`, `tokenURI`, and `contentHashOf` from the contract.
3. The metadata JSON pointed to by `tokenURI` is loaded via the configured IPFS gateway.
4. Metadata is normalized into the `FeedPost` shape, ensuring we always have `title`, `summary`, `body`, `tags`, and `createdAt` values (with sensible fallbacks).
5. The feed orders posts by `createdAt` (descending). Personalization still works via `localStorage`.

## Adding New Posts

1. Prepare metadata (`contracts/aura-post/examples/sample-post.json` is a template).
2. Upload the JSON to IPFS and capture both the CID (`tokenURI`) and its keccak256 hash (`contentHash`). Example: `ipfs://bafkreifcprjzz2d4gwux6w2yb6ofqctl4sowkkb3nfukdjn2pufslwfx4m` with hash `0x933a4a1c7193dd65aa98e1a91747bf323ab9186e6a3b9d3153d136c761bdd524`.
3. Call `publish(tokenURI, contentHash)` in Remix using the deployed contract.
4. The post appears in the feed once the ISR window (30 seconds by default) passes or after a manual reload while running locally.

## Troubleshooting

- If the feed shows an error banner, verify RPC URL, contract address, and that the contract has at least one minted post.
- Metadata fetch failures are logged to the console and skipped, preventing a single bad IPFS object from breaking the feed.
- Adjust `AURA_IPFS_GATEWAY` if you prefer a custom Pinata gateway or a local IPFS daemon.

## Testing & Scripts

- `forge test` executes the Solidity unit suite added under `contracts/test`. Install Foundry first and run `forge install foundry-rs/forge-std` from the repo root to pull in the testing library.
- Provide `AURA_SEPOLIA_RPC_URL` (can reuse `AURA_RPC_URL`) and `AURA_POST_ADDRESS` to enable the Sepolia fork smoke check in `AuraPostSepoliaForkTest`.
- Deployment helpers live in `contracts/script`:
  - `DeployAuraPost.s.sol` deploys a fresh contract (optionally minting a sample post when `AURA_POST_SAMPLE_URI` and `AURA_POST_SAMPLE_HASH` are set).
  - `SeedLocalPosts.s.sol` mints demo content into an existing contract when supplied `AURA_POST_ADDRESS`, `AURA_IPFS_URI`, and `AURA_POST_SAMPLE_HASH`.
- When seeding content, derive the hash with:

  ```bash
  node -e "import { readFileSync } from 'node:fs'; import { keccak256 } from 'viem'; const data = readFileSync('path/to/metadata.json'); console.log(keccak256(data));"
  ```
