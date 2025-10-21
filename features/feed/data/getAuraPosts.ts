import { createPublicClient, defineChain, http, type PublicClient } from "viem";
import { sepolia } from "viem/chains";
import { auraPostAbi } from "@/features/feed/data/auraPostAbi";
import type { FeedPost } from "@/features/feed/types";

type AuraMetadata = {
  name?: string;
  description?: string;
  external_url?: string;
  attributes?: Array<{ trait_type?: string; value?: string }>;
  media?: Array<{ uri?: string; mimeType?: string; title?: string }>;
  content?: {
    title?: string;
    summary?: string;
    body?: string;
    tags?: string[];
    createdAt?: string;
  };
  tags?: string[];
  createdAt?: string;
  coverImageUrl?: string;
};

const DEFAULT_CHAIN_ID = 11155111; // Sepolia

function resolveConfig() {
  const rpcUrl = process.env.AURA_RPC_URL;
  const address = process.env.AURA_POST_ADDRESS;
  const chainId = process.env.AURA_CHAIN_ID ? Number(process.env.AURA_CHAIN_ID) : DEFAULT_CHAIN_ID;

  if (!rpcUrl) {
    throw new Error("AURA_RPC_URL is not defined");
  }

  if (!address) {
    throw new Error("AURA_POST_ADDRESS is not defined");
  }

  return { rpcUrl, address: address as `0x${string}`, chainId };
}

function createClient(rpcUrl: string, chainId: number): PublicClient {
  const chain =
    chainId === sepolia.id
      ? sepolia
      : defineChain({
          id: chainId,
          name: `Chain-${chainId}`,
          network: `chain-${chainId}`,
          nativeCurrency: sepolia.nativeCurrency,
          rpcUrls: {
            default: { http: [rpcUrl] },
            public: { http: [rpcUrl] }
          }
        });

  return createPublicClient({
    chain,
    transport: http(rpcUrl)
  });
}

function resolveGatewayUri(uri: string) {
  if (uri.startsWith("ipfs://")) {
    const cid = uri.replace("ipfs://", "");
    const gateway = process.env.AURA_IPFS_GATEWAY || "https://ipfs.io/ipfs/";
    return `${gateway}${cid}`;
  }
  return uri;
}

async function fetchMetadata(tokenUri: string): Promise<AuraMetadata | null> {
  if (!tokenUri) return null;

  const resolved = resolveGatewayUri(tokenUri);
  const response = await fetch(resolved, {
    next: { revalidate: 60 }
  });
  if (!response.ok) {
    console.warn(`Failed to load metadata from ${resolved}: ${response.status}`);
    return null;
  }

  try {
    return (await response.json()) as AuraMetadata;
  } catch (error) {
    console.warn(`Failed to parse metadata from ${resolved}`, error);
    return null;
  }
}

function normalizePost(params: {
  tokenId: bigint;
  owner: `0x${string}`;
  tokenUri: string;
  contentHash: `0x${string}`;
  metadata: AuraMetadata | null;
}): FeedPost {
  const { tokenId, owner, tokenUri, contentHash, metadata } = params;

  const title =
    metadata?.content?.title ??
    metadata?.name ??
    `Aura Post #${tokenId.toString()}`;

  const summary =
    metadata?.content?.summary ??
    metadata?.description ??
    "Published via AuraPost.";

  const body =
    metadata?.content?.body ??
    metadata?.description ??
    "No body content provided.";

  const createdAt =
    metadata?.content?.createdAt ??
    metadata?.createdAt ??
    new Date().toISOString();

  const attributeTags = metadata?.attributes
    ?.filter((attr) => attr.trait_type === "tags" && typeof attr.value === "string")
    ?.map((attr) => String(attr.value));

  const tags =
    metadata?.content?.tags ??
    metadata?.tags ??
    attributeTags ??
    [];

  const coverImageUrl =
    metadata?.media?.[0]?.uri ??
    metadata?.coverImageUrl ??
    undefined;

  return {
    id: tokenId.toString(),
    tokenId: tokenId.toString(),
    title,
    summary,
    body,
    creatorAddress: owner,
    tips: 0,
    tbaAddress: null,
    createdAt: createdAt,
    coverImageUrl,
    tags,
    tokenUri,
    contentHash
  };
}

export async function getAuraPosts(): Promise<FeedPost[]> {
  const { rpcUrl, address, chainId } = resolveConfig();
  const client = createClient(rpcUrl, chainId);

  const totalSupply = await client.readContract({
    address,
    abi: auraPostAbi,
    functionName: "totalSupply"
  }) as bigint;

  if (totalSupply === 0n) {
    return [];
  }

  const tokenIds = Array.from({ length: Number(totalSupply) }, (_, index) => BigInt(index + 1));

  const posts = await Promise.all(
    tokenIds.map(async (tokenId) => {
      const [owner, tokenUri, contentHash] = await Promise.all([
        client.readContract({
          address,
          abi: auraPostAbi,
          functionName: "ownerOf",
          args: [tokenId]
        }) as Promise<`0x${string}`>,
        client.readContract({
          address,
          abi: auraPostAbi,
          functionName: "tokenURI",
          args: [tokenId]
        }) as Promise<string>,
        client.readContract({
          address,
          abi: auraPostAbi,
          functionName: "contentHashOf",
          args: [tokenId]
        }) as Promise<`0x${string}`>
      ]);

      const metadata = await fetchMetadata(tokenUri);

      return normalizePost({
        tokenId,
        owner,
        tokenUri,
        contentHash,
        metadata
      });
    })
  );

  return posts.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}
