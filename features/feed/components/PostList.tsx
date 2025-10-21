"use client";

import Link from "next/link";
import type { FeedPost } from "@/features/feed/types";
import { TipButton } from "@/features/shared/components/TipButton";
import { PostMeta } from "@/features/shared/components/PostMeta";
import styles from "@/features/feed/feed.module.css";
import cardStyles from "@/features/feed/post-card.module.css";

type PostListProps = {
  posts: FeedPost[];
  onTip: (postId: string) => void;
  hasTipped: (postId: string) => boolean;
};

export function PostList({ posts, onTip, hasTipped }: PostListProps) {
  if (!posts.length) {
    return (
      <div className={`surface ${styles.emptyState}`}>
        <h3>No posts yet</h3>
        <p>Mint a post via AuraPost.publish to populate the feed.</p>
      </div>
    );
  }

  return (
    <div className={styles.postGrid}>
      {posts.map((post) => (
        <article key={post.id} className={`surface ${cardStyles.card}`}>
          {post.coverImageUrl ? (
            <figure className={cardStyles.cover}>
              <img src={post.coverImageUrl} alt={post.title} />
            </figure>
          ) : null}
          <div className={cardStyles.cardBody}>
            <div className={cardStyles.tags}>
              {post.tags.map((tag) => (
                <span key={tag} className={cardStyles.tag}>
                  {tag}
                </span>
              ))}
            </div>
            <h3 className={cardStyles.title}>
              <Link href={`/post/${post.id}`}>{post.title}</Link>
            </h3>
            <p className={cardStyles.summary}>{post.summary}</p>
            <PostMeta
              creatorAddress={post.creatorAddress}
              tbaAddress={post.tbaAddress}
            />
          </div>
          <footer className={cardStyles.cardFooter}>
            <TipButton
              postId={post.id}
              tips={post.tips}
              hasTipped={hasTipped(post.id)}
              onTip={onTip}
            />
            <Link href={`/post/${post.id}`} className={cardStyles.readMore}>
              Read detail
            </Link>
          </footer>
        </article>
      ))}
    </div>
  );
}
