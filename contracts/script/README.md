# Contracts Scripts

Executable Foundry scripts that support deployment and local setup.

- `DeployAuraPost.s.sol` deploys the `AuraPost` contract and can pre-mint demo posts when provided with metadata.
- `SeedLocalPosts.s.sol` (optional usage) demonstrates how to mint sample posts against a local Anvil chain.

Run with:

```bash
forge script contracts/script/DeployAuraPost.s.sol --rpc-url $AURA_RPC_URL --broadcast
```

Set the `PRIVATE_KEY` env var (hex, 0x-prefixed) or configure `foundry.toml` before broadcasting.
