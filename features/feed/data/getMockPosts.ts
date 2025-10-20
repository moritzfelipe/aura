import type { MockPost } from "@/features/feed/types";
import posts from "@/data/db.json";

export async function getMockPosts(): Promise<MockPost[]> {
  return posts
    .map((post) => ({
      ...post,
      createdAt: new Date(post.createdAt).toISOString()
    }))
    .sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
}
