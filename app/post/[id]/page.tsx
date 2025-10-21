import { notFound } from "next/navigation";
import { getAuraPosts } from "@/features/feed/data/getAuraPosts";
import { PostDetailView } from "@/features/post-detail/components/PostDetailView";
import type { FeedPost } from "@/features/feed/types";

type PostPageParams = {
  id: string;
};

export const revalidate = 30;

export default async function PostPage({ params }: { params: PostPageParams }) {
  let posts: FeedPost[] = [];

  try {
    posts = await getAuraPosts();
  } catch (error) {
    console.error("Failed to load post", error);
    notFound();
  }

  const post = posts.find((item) => item.id === params.id);

  if (!post) {
    notFound();
  }

  return (
    <PostDetailView
      post={post}
      relatedPosts={posts.filter((item) => item.id !== post.id)}
    />
  );
}
