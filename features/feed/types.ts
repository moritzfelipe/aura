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
  lastTipUsd?: number;
  lastTipNote?: string;
};

export type TipInput = {
  postId: string;
  amountUsd: number;
  note?: string;
};

export type PersonalizedTip = {
  postId: string;
  totalTips: number;
  lastAmountUsd: number;
  lastNote?: string;
  lastUpdated: string;
};

export type PersonalizedState = {
  tips: PersonalizedTip[];
  lastUpdated: string;
};
