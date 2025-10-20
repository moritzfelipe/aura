import { notFound } from "next/navigation";
import { getMockPosts } from "@/features/feed/data/getMockPosts";
import { PostDetailView } from "@/features/post-detail/components/PostDetailView";

type PostPageParams = {
  id: string;
};

export async function generateStaticParams() {
  const posts = await getMockPosts();
  return posts.map((post) => ({ id: post.id }));
}

export default async function PostPage({ params }: { params: PostPageParams }) {
  const posts = await getMockPosts();
  const post = posts.find((item) => item.id === params.id);

  if (!post) {
    notFound();
  }

  return <PostDetailView post={post} relatedPosts={posts.filter((item) => item.id !== post.id)} />;
}
