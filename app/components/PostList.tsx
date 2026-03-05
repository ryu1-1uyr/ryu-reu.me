import { prisma } from "@/lib/prisma";
import PostCard from "./PostCard";

export default async function PostList() {
  const posts = await prisma.post.findMany({
    where: { published: false },
    orderBy: { createdAt: "desc" },
    include: { author: true },
  });
  console.log(posts, "posts");

  if (posts.length === 0) {
    return (
      <div className="p-6 text-center text-gray-500">投稿がまだありません</div>
    );
  }

  // postの型は以下
  // id: string;
  // title: string;
  // slug: string;
  // content: string;
  // published: boolean;
  // createdAt: Date;
  // updatedAt: Date;
  // authorId: string;

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-4">
      <h2 className="text-2xl font-bold mb-4">投稿一覧</h2>
      {posts.map((post) => (
        <PostCard
          key={post.id}
          title={post.title}
          slug={post.slug}
          authorEmail={post.author.email}
          createdAt={post.createdAt}
          content={post.content}
        />
      ))}
    </div>
  );
}
