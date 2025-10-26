# Contracts Tests

Foundry-based tests for Valeu’s on-chain components.

- `ValeuPost.t.sol` covers the publishing lifecycle, sequential IDs, and content hash integrity on the `ValeuPost` ERC-721.
- `ValeuPostAccount.t.sol` validates the ERC-6551 account boundary (owner-gated execution, state tracking, and ERC-1271 checks).
- `ValeuPostAccountIntegration.t.sol` bootstraps a token-bound account via the minimal proxy bytecode and confirms tips land on the deployed account address.

Run the full suite with:

```bash
forge test
```

See the repo-level docs for Sepolia fork guidance and script usage.
