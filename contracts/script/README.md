# Contracts Scripts

Executable Foundry scripts that support deployment and local setup.

- `DeployAuraPost.s.sol` deploys the `AuraPost` contract and can pre-mint demo posts when provided with metadata.
- `SeedLocalPosts.s.sol` (optional usage) mints sample posts against an existing contract and, when supplied `AURA_ERC6551_REGISTRY` / `AURA_ACCOUNT_IMPLEMENTATION`, creates the matching ERC-6551 account automatically (toggle with `AURA_CREATE_TOKEN_ACCOUNT=false` if you need to skip the registry call).

Run with:

```bash
forge script contracts/script/DeployAuraPost.s.sol --rpc-url $AURA_RPC_URL --broadcast
```

Set the `PRIVATE_KEY` env var (hex, 0x-prefixed) or configure `foundry.toml` before broadcasting.
