import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import { IS_DEV } from "@/lib/env";
import PostListView from "@/app/components/PostListView";
import PostsHydrator from "@/app/components/PostsHydrator";

// 1週間キャッシュ。記事 publish/update 時に revalidateTag("posts") で明示破棄する。
// 保険として1週間で自動失効（書き忘れがあっても最終的には更新される）。
const getRecentPosts = unstable_cache(
  async () => {
    const posts = await prisma.post.findMany({
      where: IS_DEV ? undefined : { published: true },
      orderBy: { createdAt: "desc" },
      include: { author: true, tags: { include: { tag: true } } },
      take: 3,
    });

    return posts.map((post) => ({
      id: post.id,
      title: post.title,
      slug: post.slug,
      authorEmail: post.author.email,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      content: post.content,
      tags: post.tags.map((pt) => pt.tag.name),
    }));
  },
  ["recent-posts"],
  { revalidate: 86400, tags: ["posts"] }
);

export default async function PostList() {
  const items = await getRecentPosts();

  return (
    <>
      <PostsHydrator posts={items} />
      <PostListView posts={items} showMoreLink showHeading={false} />
    </>
  );
}
