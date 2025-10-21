import { getAuraPosts } from "@/features/feed/data/getAuraPosts";
import { FeedView } from "@/features/feed/components/FeedView";
import type { FeedPost } from "@/features/feed/types";
import styles from "./page.module.css";

export const revalidate = 30;

export default async function HomePage() {
  let posts: FeedPost[] = [];
  let error: string | null = null;

  try {
    posts = await getAuraPosts();
  } catch (err) {
    console.error("Failed to fetch Aura posts", err);
    error =
      "Unable to reach the AuraPost contract. Check RPC/config and try again.";
  }

  return (
    <div className={styles.pageWrap}>
      {error ? <p className={styles.error}>{error}</p> : null}
      <FeedView initialPosts={posts} />
    </div>
  );
}
