import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";

const SITE_URL = "https://www.ryu-reu.me";
const SITE_TITLE = "りゆうのブログ: 実験場";
const SITE_DESCRIPTION = "ブログとか思いついた機能をガンガン乗せるマイページ";

// 1時間 ISR。記事更新時は revalidateTag("posts") で即破棄。
export const revalidate = 3600;

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

// posts タグで他の Post クエリと同じ無効化軸に乗る。
// route 側で `revalidate = 3600` を指定済みなので、ここでは revalidate は持たず
// tag による invalidation だけを担当する (記事更新時の `revalidatePath("/feed.xml")`
// で route 全体が破棄され、再生成時にこの関数が呼ばれて最新を取る)。
const getFeedPosts = unstable_cache(
  async () => {
    return prisma.post.findMany({
      where: { published: true },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        title: true,
        slug: true,
        content: true,
        createdAt: true,
      },
    });
  },
  ["feed-posts"],
  { tags: ["posts"] }
);

export async function GET() {
  const posts = await getFeedPosts();

  const lastBuild = posts[0]?.createdAt ?? new Date();

  const items = posts
    .map((post) => {
      const link = `${SITE_URL}/posts/${encodeURIComponent(post.slug)}`;
      const description = post.content.slice(0, 200).replace(/\n/g, " ");
      return `    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${link}</link>
      <guid>${link}</guid>
      <pubDate>${post.createdAt.toUTCString()}</pubDate>
      <description>${escapeXml(description)}</description>
    </item>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(SITE_TITLE)}</title>
    <link>${SITE_URL}</link>
    <description>${escapeXml(SITE_DESCRIPTION)}</description>
    <language>ja</language>
    <lastBuildDate>${lastBuild.toUTCString()}</lastBuildDate>
    <atom:link href="${SITE_URL}/feed.xml" rel="self" type="application/rss+xml"/>
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "s-maxage=3600, stale-while-revalidate",
    },
  });
}
