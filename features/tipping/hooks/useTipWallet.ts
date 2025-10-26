"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import {
  createWalletClient,
  custom,
  defineChain,
  type Chain,
  type EIP1193Provider,
  type Hex,
  type WalletClient
} from "viem";
import { sepolia } from "viem/chains";

const DEFAULT_CHAIN_ID = 11155111;

function resolveChain(chainId: number): Chain {
  if (chainId === sepolia.id) {
    return sepolia;
  }

  return defineChain({
    id: chainId,
    name: `Chain-${chainId}`,
    network: `chain-${chainId}`,
    nativeCurrency: sepolia.nativeCurrency,
    rpcUrls: {
      default: { http: sepolia.rpcUrls.default.http },
      public: { http: sepolia.rpcUrls.default.http }
    }
  });
}

const targetChainId = Number.parseInt(
  process.env.NEXT_PUBLIC_VALEU_CHAIN_ID ?? `${DEFAULT_CHAIN_ID}`,
  10
);
const targetChain = resolveChain(
  Number.isNaN(targetChainId) ? DEFAULT_CHAIN_ID : targetChainId
);

const DEFAULT_POLL_INTERVAL_MS = 2_000;
const DEFAULT_MAX_ATTEMPTS = 60;

type TipWalletState = {
  account: `0x${string}` | null;
  connect: () => Promise<{ account: `0x${string}`; walletClient: WalletClient }>;
  sendTip: (params: { to: `0x${string}`; valueWei: bigint }) => Promise<Hex>;
  isConnecting: boolean;
  isConnected: boolean;
  error: string | null;
  resetError: () => void;
};

export function useTipWallet(): TipWalletState {
  const [walletClient, setWalletClient] = useState<WalletClient | null>(null);
  const [account, setAccount] = useState<`0x${string}` | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const walletClientRef = useRef<WalletClient | null>(null);
  const accountRef = useRef<`0x${string}` | null>(null);

  const ensureChain = useCallback(async (client: WalletClient) => {
    try {
      const activeChainId = await client.getChainId();
      if (activeChainId !== targetChain.id) {
        await client.switchChain({ id: targetChain.id });
      }
    } catch (chainError) {
      console.warn("Unable to validate/switch chain", chainError);
    }
  }, []);

  const connect = useCallback(async () => {
    if (walletClientRef.current && accountRef.current) {
      return { walletClient: walletClientRef.current, account: accountRef.current };
    }

    if (typeof window === "undefined") {
      setError("Wallet connections are only available in the browser.");
      throw new Error("Wallet connections are only available in the browser.");
    }

    const provider = (window as Window & { ethereum?: EIP1193Provider }).ethereum;
    if (!provider) {
      const message = "No injected wallet found. Install MetaMask or a compatible provider.";
      setError(message);
      throw new Error(message);
    }

    setIsConnecting(true);
    setError(null);

    try {
      const client = createWalletClient({
        chain: targetChain,
        transport: custom(provider)
      });

      const [primaryAccount] = await client.requestAddresses();
      if (!primaryAccount) {
        throw new Error("Wallet did not return an account.");
      }

      await ensureChain(client);

      setWalletClient(client);
      setAccount(primaryAccount);
      walletClientRef.current = client;
      accountRef.current = primaryAccount;
      return { walletClient: client, account: primaryAccount };
    } catch (connectError) {
      const message =
        connectError instanceof Error ? connectError.message : "Failed to connect wallet.";
      setError(message);
      throw connectError;
    } finally {
      setIsConnecting(false);
    }
  }, [ensureChain]);

  const sendTip = useCallback(
    async ({ to, valueWei }: { to: `0x${string}`; valueWei: bigint }) => {
      if (!walletClientRef.current || !accountRef.current) {
        const result = await connect();
        walletClientRef.current = result.walletClient;
        accountRef.current = result.account;
      }

      const client = walletClientRef.current;
      const from = accountRef.current;

      if (!client || !from) {
        const message = "Connect a wallet before sending value.";
        setError(message);
        throw new Error(message);
      }

      await ensureChain(client);

      try {
        const hash = await client.sendTransaction({
          account: from,
          chain: targetChain,
          to,
          value: valueWei
        });

        await waitForReceipt(client, hash);
        return hash;
      } catch (transactionError) {
        const message =
          transactionError instanceof Error
            ? transactionError.message
            : "Failed to send value transaction.";
        setError(message);
        throw transactionError;
      }
    },
    [connect, ensureChain]
  );

  const resetError = useCallback(() => {
    setError(null);
  }, []);

  const state = useMemo(
    () => ({
      account,
      connect,
      sendTip,
      isConnecting,
      isConnected: Boolean(account),
      error,
      resetError
    }),
    [account, connect, error, isConnecting, resetError, sendTip]
  );

  return state;
}

async function waitForReceipt(client: WalletClient, hash: Hex) {
  for (let attempt = 0; attempt < DEFAULT_MAX_ATTEMPTS; attempt++) {
    const receipt = await client.transport.request({
      method: "eth_getTransactionReceipt",
      params: [hash]
    });

    if (receipt) {
      return receipt;
    }

    await new Promise((resolve) => setTimeout(resolve, DEFAULT_POLL_INTERVAL_MS));
  }

  throw new Error("Timed out waiting for value confirmation.");
}
