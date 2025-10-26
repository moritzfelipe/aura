import { notFound } from "next/navigation";
import { getValeuPosts } from "@/features/feed/data/getValeuPosts";
import { FeedView } from "@/features/feed/components/FeedView";
import type { FeedPost } from "@/features/feed/types";

type PostPageParams = {
  id: string;
};

export const revalidate = 30;

export default async function PostPage({ params }: { params: PostPageParams }) {
  let posts: FeedPost[] = [];

  try {
    posts = await getValeuPosts();
  } catch (error) {
    console.error("Failed to load post", error);
    notFound();
  }

  const postExists = posts.some((item) => item.id === params.id);

  if (!postExists) {
    notFound();
  }

  return <FeedView initialPosts={posts} initialExpandedId={params.id} />;
}
