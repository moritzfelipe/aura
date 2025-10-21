export type FeedPost = {
  id: string;
  tokenId: string;
  title: string;
  summary: string;
  body: string;
  creatorAddress: string;
  tips: number;
  tbaAddress: string | null;
  createdAt: string;
  coverImageUrl?: string;
  tags: string[];
  tokenUri: string;
  contentHash: string;
};

export type PersonalizedState = {
  tippedPostIds: string[];
  lastUpdated: string;
};
