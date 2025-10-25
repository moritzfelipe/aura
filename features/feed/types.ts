export type FeedPost = {
  id: string;
  tokenId: string;
  title: string;
  summary: string;
  body: string;
  creatorAddress: string;
  tips: number;
  createdAt: string;
  coverImageUrl?: string;
  tags: string[];
  tokenUri: string;
  contentHash: string;
  tbaAddress: `0x${string}`;
  lastTipUsd?: number;
};

export type TipInput = {
  postId: string;
  amountUsd: number;
};

export type PersonalizedTip = {
  postId: string;
  totalTips: number;
  lastAmountUsd: number;
  lastUpdated: string;
};

export type PersonalizedState = {
  tips: PersonalizedTip[];
  lastUpdated: string;
};
