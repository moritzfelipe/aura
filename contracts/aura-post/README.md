# Valeu Post Contract (AuraPost.sol)

Minimal ERC-721 used for Phase 2 of the roadmap. Any address can call `publish` to mint a post NFT to itself. The contract stores a content hash alongside the token URI so the Valeu frontend can verify IPFS payloads.

## Key Functions

- `publish(string tokenURI, bytes32 contentHash)` – Mints to `msg.sender`, stores the hash, and emits `PostPublished`.
- `totalSupply()` – Returns the number of minted posts (used by the curator app to iterate).
- `contentHashOf(uint256 tokenId)` – Read the integrity hash for an existing post.

Token IDs start at 1 and increment sequentially to make client-side pagination predictable (`for (let id = 1; id <= totalSupply; id++)`).

## Deploying with Remix

1. Paste `AuraPost.sol` into a Remix workspace (enable the OpenZeppelin dependency via NPM import).
2. Compile with Solidity `0.8.27` (enable optimizer if desired).
3. Switch Remix to the Sepolia network and deploy `AuraPost` (no constructor arguments).
4. Call `publish(tokenURI, contentHash)` using:
   - `tokenURI`: IPFS URI (e.g. `ipfs://Qm...`).
   - `contentHash`: 32-byte keccak hash of the post JSON (`0x` prefixed).

Each successful call increments `totalSupply` and emits a `PostPublished` event.

## IPFS Metadata Template

Use `contracts/aura-post/examples/sample-post.json` as a starting point for the metadata you upload to IPFS. The structure keeps richer copy under `content` while maintaining compatibility with marketplace conventions at the top level (`name`, `description`, `external_url`, `attributes`).

1. Duplicate the sample file, adjust the fields (title, body markdown, media URLs, etc.).
2. Upload the JSON verbatim to IPFS (Pinata, web3.storage, etc.). The resulting CID becomes your `tokenURI`.
3. Compute the `contentHash` by hashing the **exact JSON bytes** you uploaded. Install `viem` once via `npm install viem`, then run:

   ```bash
   node -e "import { readFileSync } from 'node:fs'; import { keccak256 } from 'viem'; const data = readFileSync('contracts/aura-post/examples/sample-post.json'); console.log(keccak256(data));"
   ```

   The script prints a `0x...` value you can pass directly to `publish`.

## Frontend Integration

Expose the contract address and RPC URL through environment variables:

```
VALEU_RPC_URL=https://sepolia.infura.io/v3/<key>
VALEU_POST_ADDRESS=0xYourDeployedContract
```

The Next.js app will fetch posts by looping from `1` to `totalSupply`, calling `tokenURI`/`contentHashOf`, and dereferencing the IPFS metadata. Tip functionality remains local until Phase 3.

## Foundry Tests & Scripts

- Run `forge test --match-contract AuraPostTest` for focused checks on publish flows, sequential IDs, and hash integrity.
- `foundry.toml` is configured to consume `node_modules/@openzeppelin/contracts`; install `forge-std` once with `forge install foundry-rs/forge-std`.
- `DeployAuraPost.s.sol` broadcasts a new contract; supply `PRIVATE_KEY` and `VALEU_POST_SAMPLE_*` env vars to mint a demo post immediately after deployment.
- Use `SeedLocalPosts.s.sol` to mint additional posts into an existing deployment when exercising the curator UI against Anvil or Sepolia.
