"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { KeyboardEvent } from "react";
import ReactMarkdown from "react-markdown";
import type { FeedPost, TipInput, PersonalizedTip } from "@/features/feed/types";
import { TipButton } from "@/features/shared/components/TipButton";
import styles from "@/features/feed/timeline.module.css";

type PostListProps = {
  posts: FeedPost[];
  onTip: (input: TipInput) => void;
  hasTipped: (postId: string) => boolean;
  getTip: (postId: string) => PersonalizedTip | undefined;
  initialExpandedId?: string;
};

const truncateAddress = (value: string) => {
  if (!value) return "Unknown";
  return `${value.slice(0, 6)}…${value.slice(-4)}`;
};

const formatTimestamp = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) {
    return value;
  }
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(date);
};

const resolveTokenUri = (uri: string) => {
  if (uri.startsWith("ipfs://")) {
    const cid = uri.replace("ipfs://", "");
    const gateway = process.env.NEXT_PUBLIC_AURA_IPFS_GATEWAY ?? "https://ipfs.io/ipfs/";
    return `${gateway}${cid}`;
  }
  return uri;
};

export function PostList({
  posts,
  onTip,
  hasTipped,
  getTip,
  initialExpandedId
}: PostListProps) {
  const [expandedId, setExpandedId] = useState<string | null>(initialExpandedId ?? null);

  useEffect(() => {
    setExpandedId(initialExpandedId ?? null);
  }, [initialExpandedId]);

  const handleToggle = useCallback(
    (postId: string) => {
      setExpandedId((current) => (current === postId ? null : postId));
    },
    []
  );

  const handleKeyToggle = useCallback(
    (event: KeyboardEvent<HTMLElement>, postId: string) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        handleToggle(postId);
      }
    },
    [handleToggle]
  );

  const orderedPosts = useMemo(() => posts, [posts]);

  if (!orderedPosts.length) {
    return (
      <div className={`surface ${styles.emptyState}`}>
        <h3>No posts yet</h3>
        <p>Mint a post via AuraPost.publish to populate the feed.</p>
      </div>
    );
  }

  return (
    <div className={styles.timeline}>
      {orderedPosts.map((post) => {
        const isExpanded = expandedId === post.id;
        const tip = getTip(post.id);
        const tokenUri = resolveTokenUri(post.tokenUri);

        return (
          <article
            key={post.id}
            className={[
              "surface",
              styles.item,
              isExpanded ? styles.itemExpanded : ""
            ].join(" ")}
            tabIndex={0}
            role="button"
            aria-expanded={isExpanded}
            onClick={() => handleToggle(post.id)}
            onKeyDown={(event) => handleKeyToggle(event, post.id)}
          >
            <div className={styles.clickArea}>
              <header className={styles.header}>
                <div className={styles.avatar}>{post.creatorAddress.slice(2, 4)}</div>
                <div className={styles.headerMeta}>
                  <span className={styles.creator}>{truncateAddress(post.creatorAddress)}</span>
                  <span className={styles.dot}>·</span>
                  <span className={styles.timestamp}>{formatTimestamp(post.createdAt)}</span>
                </div>
              </header>
              <div className={styles.copy}>
                <h3 className={styles.title}>{post.title}</h3>
                <p className={styles.summary}>{post.summary}</p>
                {post.tags.length ? (
                  <div className={styles.tags}>
                    {post.tags.map((tag) => (
                      <span key={tag} className={styles.tag}>
                        #{tag}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>

            {post.coverImageUrl ? (
              <figure className={styles.media} onClick={(event) => event.stopPropagation()}>
                <img src={post.coverImageUrl} alt={post.title} />
              </figure>
            ) : null}

            {isExpanded ? (
              <div
                className={styles.expanded}
                onClick={(event) => event.stopPropagation()}
              >
                <div className={styles.body}>
                  <ReactMarkdown>{post.body}</ReactMarkdown>
                </div>
                <div className={styles.onchain}>
                  <div className={styles.onchainRow}>
                    <span className={styles.onchainLabel}>Token #{post.tokenId}</span>
                    <a
                      href={tokenUri}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(event) => event.stopPropagation()}
                    >
                      Metadata ↗
                    </a>
                  </div>
                  <div className={styles.onchainRow}>
                    <span className={styles.onchainLabel}>Content hash</span>
                    <span className={styles.hashValue}>{post.contentHash}</span>
                  </div>
                </div>
              </div>
            ) : null}

            <footer
              className={styles.actions}
              onClick={(event) => event.stopPropagation()}
            >
              <TipButton
                postId={post.id}
                hasTipped={hasTipped(post.id)}
                onTip={onTip}
                totalTips={post.tips}
                lastTipUsd={tip?.lastAmountUsd ?? post.lastTipUsd}
                lastTipNote={tip?.lastNote ?? post.lastTipNote}
              />
            </footer>
          </article>
        );
      })}
    </div>
  );
}
