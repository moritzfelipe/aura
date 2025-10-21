"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { FeedPost, TipInput, PersonalizedTip } from "@/features/feed/types";
import { useLocalStorageTips } from "@/features/personalization/hooks/useLocalStorageTips";

type UsePersonalizedFeedResult = {
  posts: FeedPost[];
  onTip: (input: TipInput) => void;
  isPersonalized: boolean;
  togglePersonalized: () => void;
  hasTipped: (postId: string) => boolean;
  getTip: (postId: string) => PersonalizedTip | undefined;
};

export function usePersonalizedFeed(initialPosts: FeedPost[]): UsePersonalizedFeedResult {
  const [posts, setPosts] = useState<FeedPost[]>(() =>
    initialPosts.map((post) => ({ ...post }))
  );
  const [isPersonalized, setIsPersonalized] = useState(false);
  const { tippedPostIds, registerTip, hasTipped, getTip } = useLocalStorageTips();

  useEffect(() => {
    setPosts(
      initialPosts.map((post) => {
        const tip = getTip(post.id);
        return {
          ...post,
          tips: (tip?.totalTips ?? 0) + post.tips,
          lastTipUsd: tip?.lastAmountUsd ?? post.lastTipUsd,
          lastTipNote: tip?.lastNote ?? post.lastTipNote
        };
      })
    );
  }, [initialPosts, tippedPostIds, getTip]);

  const handleTip = useCallback(
    ({ postId, amountUsd, note }: TipInput) => {
      setPosts((current) =>
        current.map((post) =>
          post.id === postId
            ? {
                ...post,
                tips: post.tips + 1,
                lastTipUsd: amountUsd,
                lastTipNote: note
              }
            : post
        )
      );
      registerTip(postId, amountUsd, note);
    },
    [registerTip]
  );

  const orderedPosts = useMemo(() => {
    const base = [...posts];
    if (!isPersonalized) {
      return base.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    }

    const tippedSet = new Set(tippedPostIds);
    return base.sort((a, b) => {
      const aTipped = tippedSet.has(a.id);
      const bTipped = tippedSet.has(b.id);
      if (aTipped && !bTipped) return -1;
      if (!aTipped && bTipped) return 1;
      if (a.tips !== b.tips) return b.tips - a.tips;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [posts, tippedPostIds, isPersonalized]);

  const togglePersonalized = useCallback(() => {
    setIsPersonalized((value) => !value);
  }, []);

  return {
    posts: orderedPosts,
    onTip: handleTip,
    isPersonalized,
    togglePersonalized,
    hasTipped,
    getTip
  };
}
