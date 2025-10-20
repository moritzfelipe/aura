import { getMockPosts } from "@/features/feed/data/getMockPosts";
import { FeedView } from "@/features/feed/components/FeedView";

export default async function HomePage() {
  const posts = await getMockPosts();
  return <FeedView initialPosts={posts} />;
}
