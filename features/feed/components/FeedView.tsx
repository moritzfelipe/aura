"use client";

import type { FeedPost } from "@/features/feed/types";
import { usePersonalizedFeed } from "@/features/feed/hooks/usePersonalizedFeed";
import { PersonalizedToggle } from "@/features/personalization/components/PersonalizedToggle";
import { PostList } from "@/features/feed/components/PostList";
import styles from "@/features/feed/feed.module.css";

type FeedViewProps = {
  initialPosts: FeedPost[];
  initialExpandedId?: string;
};

export function FeedView({ initialPosts, initialExpandedId }: FeedViewProps) {
  const { posts, onTip, isPersonalized, togglePersonalized, hasTipped, getTip } =
    usePersonalizedFeed(initialPosts);

  return (
    <section className={styles.feedContainer}>
      <div className={styles.feedControls}>
        <div className={styles.feedIntro}>
          <div>
            <h2 className={styles.feedTitle}>Discovery Feed</h2>
            <p className={styles.feedSubtitle}>
              Live posts pulled from the Valeu post contract on Sepolia. Expand
              any post to read it inline and simulate a value contribution in USD
              (we handle the rough ETH conversion locally).
            </p>
          </div>
        </div>
        <PersonalizedToggle
          isEnabled={isPersonalized}
          onToggle={togglePersonalized}
        />
      </div>
      <PostList
        posts={posts}
        onTip={onTip}
        hasTipped={hasTipped}
        getTip={getTip}
        initialExpandedId={initialExpandedId}
      />
    </section>
  );
}
