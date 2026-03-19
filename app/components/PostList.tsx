import { prisma } from "@/lib/prisma";
import PostListView from "@/app/components/PostListView";
import PostsHydrator from "@/app/components/PostsHydrator";

const isDev = process.env.NODE_ENV === "development";

export default async function PostList() {
  const posts = await prisma.post.findMany({
    where: isDev ? undefined : { published: true },
    orderBy: { createdAt: "desc" },
    include: { author: true },
    take: 3,
  });

  const items = posts.map((post) => ({
    id: post.id,
    title: post.title,
    slug: post.slug,
    authorEmail: post.author.email,
    createdAt: post.createdAt,
    updatedAt: post.updatedAt,
    content: post.content,
  }));

  return (
    <>
      <PostsHydrator posts={items} />
      <PostListView posts={items} showMoreLink />
    </>
  );
}
