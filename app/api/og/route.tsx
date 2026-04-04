import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { OgCard } from "@/app/components/OgCard/OgCard";

export const runtime = "nodejs";

// 記事本文から最初の画像 URL を抽出
function extractFirstImageUrl(content: string): string | null {
  // Markdown: ![alt](url)
  const mdMatch = content.match(/!\[[^\]]*\]\(([^)]+)\)/);
  if (mdMatch) return mdMatch[1];

  // HTML: <img src="url"
  const htmlMatch = content.match(/<img[^>]+src=["']([^"']+)["']/);
  if (htmlMatch) return htmlMatch[1];

  return null;
}

const FONT_URL =
  "https://fonts.gstatic.com/s/yuseimagic/v12/yYLt0hbAyuCmoo5wlhPkpjHR.ttf";

let fontCache: ArrayBuffer | null = null;

async function getFontData(): Promise<ArrayBuffer> {
  if (fontCache) return fontCache;
  const data = await fetch(FONT_URL).then((res) => res.arrayBuffer());
  fontCache = data;
  return data;
}

const fontOptions = async () => ({
  width: 1200 as const,
  height: 630 as const,
  fonts: [
    {
      name: "Yusei Magic",
      data: await getFontData(),
      style: "normal" as const,
    },
  ],
});

export async function GET(request: NextRequest) {
  const slug = request.nextUrl.searchParams.get("slug");

  const avatarUrl = `${request.nextUrl.origin}/me.png`;

  if (!slug) {
    return new ImageResponse(
      <OgCard title="りゆうの実験場" avatarUrl={avatarUrl} />,
      await fontOptions()
    );
  }

  const post = await prisma.post.findUnique({
    where: { slug: decodeURIComponent(slug) },
    select: { title: true, content: true },
  });

  if (!post) {
    return new ImageResponse(
      <OgCard title="記事が見つかりません" avatarUrl={avatarUrl} />,
      await fontOptions()
    );
  }

  const thumbnailUrl = extractFirstImageUrl(post.content);

  const description = post.content
    .replace(/!\[.*?\]\(.*?\)/g, "")
    .replace(/<[^>]*>/g, "")
    .replace(/[#*`~>\-|]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 120);

  return new ImageResponse(
    <OgCard
      title={post.title}
      description={description}
      thumbnailUrl={thumbnailUrl}
      avatarUrl={avatarUrl}
    />,
    await fontOptions()
  );
}
