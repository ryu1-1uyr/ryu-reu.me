import { prisma } from "@/lib/prisma";
import PostListView from "@/app/components/PostListView";

// こいつはコンポーネントである必要はなさそう。使う箇所に移植してこいつは消す
export default async function PostList() {
  const posts = await prisma.post.findMany({
    // 合わせてpublishedの条件も直す
    where: { published: false },
    orderBy: { createdAt: "desc" },
    include: { author: true },
  });

  const items = posts.map((post) => ({
    id: post.id,
    title: post.title,
    slug: post.slug,
    authorEmail: post.author.email,
    createdAt: post.createdAt,
    content: post.content,
  }));

  return <PostListView posts={items} />;
}
