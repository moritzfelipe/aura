"use client";

import type { MockPost } from "@/features/feed/types";
import { usePersonalizedFeed } from "@/features/feed/hooks/usePersonalizedFeed";
import { PersonalizedToggle } from "@/features/personalization/components/PersonalizedToggle";
import { PostList } from "@/features/feed/components/PostList";
import styles from "@/features/feed/feed.module.css";

type FeedViewProps = {
  initialPosts: MockPost[];
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
            Phase 1 mock pulling structured posts from a local dataset. Tip to
            surface favourites and feel the personalization loop.
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
