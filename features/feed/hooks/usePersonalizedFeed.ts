"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { MockPost } from "@/features/feed/types";
import { useLocalStorageTips } from "@/features/personalization/hooks/useLocalStorageTips";

type UsePersonalizedFeedResult = {
  posts: MockPost[];
  onTip: (postId: string) => void;
  isPersonalized: boolean;
  togglePersonalized: () => void;
  hasTipped: (postId: string) => boolean;
};

export function usePersonalizedFeed(initialPosts: MockPost[]): UsePersonalizedFeedResult {
  const [posts, setPosts] = useState<MockPost[]>(() =>
    initialPosts.map((post) => ({ ...post }))
  );
  const [isPersonalized, setIsPersonalized] = useState(false);
  const { tippedPostIds, registerTip, hasTipped } = useLocalStorageTips();

  useEffect(() => {
    setPosts(
      initialPosts.map((post) => ({
        ...post,
        tips: tippedPostIds.includes(post.id) ? post.tips + 1 : post.tips
      }))
    );
  }, [initialPosts, tippedPostIds]);

  const handleTip = useCallback(
    (postId: string) => {
      setPosts((current) =>
        current.map((post) =>
          post.id === postId
            ? {
                ...post,
                tips: post.tips + 1
              }
            : post
        )
      );
      registerTip(postId);
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
    hasTipped
  };
}
