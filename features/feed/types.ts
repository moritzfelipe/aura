export type MockPost = {
  id: string;
  title: string;
  summary: string;
  body: string;
  creatorAddress: string;
  tips: number;
  tbaAddress: string;
  createdAt: string;
  coverImageUrl?: string;
  tags: string[];
};

export type PersonalizedState = {
  tippedPostIds: string[];
  lastUpdated: string;
};
