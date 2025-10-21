"use client";

import type { FeedPost } from "@/features/feed/types";
import { usePersonalizedFeed } from "@/features/feed/hooks/usePersonalizedFeed";
import { PersonalizedToggle } from "@/features/personalization/components/PersonalizedToggle";
import { PostList } from "@/features/feed/components/PostList";
import styles from "@/features/feed/feed.module.css";

type FeedViewProps = {
  initialPosts: FeedPost[];
};

export function FeedView({ initialPosts }: FeedViewProps) {
  const { posts, onTip, isPersonalized, togglePersonalized, hasTipped } =
    usePersonalizedFeed(initialPosts);

  return (
    <section className={styles.feedContainer}>
      <div className={`${styles.feedControls} surface`}>
        <div>
          <h2 className={styles.feedTitle}>Discovery Feed</h2>
          <p className={styles.feedSubtitle}>
            Live posts pulled from the AuraPost contract on Sepolia. Tip to
            surface favourites locally while we keep iterating on the
            personalization loop.
          </p>
        </div>
        <PersonalizedToggle
          isEnabled={isPersonalized}
          onToggle={togglePersonalized}
        />
      </div>
      <PostList posts={posts} onTip={onTip} hasTipped={hasTipped} />
    </section>
  );
}
