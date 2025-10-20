"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import type { MockPost } from "@/features/feed/types";
import { TipButton } from "@/features/shared/components/TipButton";
import { PostMeta } from "@/features/shared/components/PostMeta";
import { useLocalStorageTips } from "@/features/personalization/hooks/useLocalStorageTips";
import styles from "@/features/post-detail/post-detail.module.css";

type PostDetailViewProps = {
  post: MockPost;
  relatedPosts: MockPost[];
};

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));

export function PostDetailView({ post, relatedPosts }: PostDetailViewProps) {
  const { registerTip, hasTipped } = useLocalStorageTips();
  const [tipCount, setTipCount] = useState(post.tips);

  const sortedRelated = useMemo(
    () =>
      relatedPosts
        .filter((item) => item.id !== post.id)
        .slice(0, 3),
    [relatedPosts, post.id]
  );

  const handleTip = (postId: string) => {
    setTipCount((count) => count + 1);
    registerTip(postId);
  };

  return (
    <div className={styles.container}>
      <Link href="/" className={styles.backLink}>
        ← Back to feed
      </Link>
      <article className={`surface ${styles.detailCard}`}>
        <header className={styles.header}>
          <div className={styles.headerCopy}>
            <div className={styles.tagList}>
              {post.tags.map((tag) => (
                <span key={tag} className={styles.tag}>
                  {tag}
                </span>
              ))}
            </div>
            <h1>{post.title}</h1>
            <p className={styles.summary}>{post.summary}</p>
          </div>
          <div className={styles.metaBlock}>
            <span className={styles.timestamp}>
              Published {formatDate(post.createdAt)}
            </span>
            <PostMeta
              creatorAddress={post.creatorAddress}
              tbaAddress={post.tbaAddress}
            />
            <TipButton
              postId={post.id}
              tips={tipCount}
              hasTipped={hasTipped(post.id)}
              onTip={handleTip}
            />
          </div>
        </header>
        {post.coverImageUrl ? (
          <figure className={styles.cover}>
            <img src={post.coverImageUrl} alt={post.title} />
          </figure>
        ) : null}
        <div className={styles.body}>
          <ReactMarkdown>{post.body}</ReactMarkdown>
        </div>
      </article>
      {sortedRelated.length ? (
        <aside className={`surface ${styles.related}`}>
          <h2>More from Aura</h2>
          <ul>
            {sortedRelated.map((entry) => (
              <li key={entry.id}>
                <Link href={`/post/${entry.id}`}>
                  <span>{entry.title}</span>
                  <span className={styles.relatedMeta}>
                    {hasTipped(entry.id) ? "Tipped" : `${entry.tips} tips`}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </aside>
      ) : null}
    </div>
  );
}
