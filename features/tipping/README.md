# Tipping Feature

Client-side utilities that bridge the UI to real tip transactions.

- `hooks/useTipWallet` manages an injected-wallet connection (MetaMask, Rabby, etc.), ensures the user is on the configured chain (`NEXT_PUBLIC_VALEU_CHAIN_ID`, defaults to Sepolia), and exposes a `sendTip` helper that waits for transaction confirmation before resolving.

The feed continues to own on-chain fetching (`getValeuPosts`). Tip UI components can pull `tbaAddress` from each `FeedPost` and call `useTipWallet` to broadcast ETH transfers.
