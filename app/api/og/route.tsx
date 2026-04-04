import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import { readFile } from "fs/promises";
import path from "path";
import { prisma } from "@/lib/prisma";
import { OgCard } from "@/app/components/OgCard/OgCard";

export const runtime = "nodejs";

// モジュールスコープでキャッシュ（プロセス生存中は再読み込みしない）
let fontCache: ArrayBuffer | null = null;
let avatarCache: string | null = null;

async function getFontData(): Promise<ArrayBuffer> {
  if (fontCache) return fontCache;
  const fontPath = path.join(process.cwd(), "public/fonts/YuseiMagic-Regular.ttf");
  const buf = await readFile(fontPath);
  fontCache = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer;
  return fontCache;
}

async function getAvatarBase64(): Promise<string> {
  if (avatarCache) return avatarCache;
  const avatarPath = path.join(process.cwd(), "public/me.png");
  const buf = await readFile(avatarPath);
  avatarCache = `data:image/png;base64,${buf.toString("base64")}`;
  return avatarCache;
}

// 記事本文から最初の画像 URL を抽出
function extractFirstImageUrl(content: string): string | null {
  const mdMatch = content.match(/!\[[^\]]*\]\(([^)]+)\)/);
  if (mdMatch) return mdMatch[1];
  const htmlMatch = content.match(/<img[^>]+src=["']([^"']+)["']/);
  if (htmlMatch) return htmlMatch[1];
  return null;
}

function extractDescription(content: string): string {
  return content
    .replace(/!\[.*?\]\(.*?\)/g, "")
    .replace(/<[^>]*>/g, "")
    .replace(/[#*`~>\-|]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 120);
}

// slug → { title, description, thumbnailUrl } を解決（フォールバック用）
async function resolveFromSlug(slug: string) {
  const post = await prisma.post.findUnique({
    where: { slug: decodeURIComponent(slug) },
    select: { title: true, content: true },
  });
  if (!post) return null;
  return {
    title: post.title,
    description: extractDescription(post.content),
    thumbnailUrl: extractFirstImageUrl(post.content),
  };
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const titleParam = searchParams.get("title");
  const descParam = searchParams.get("desc");
  const slugParam = searchParams.get("slug");

  let title = "りゆうの実験場";
  let description: string | undefined;
  let thumbnailUrl: string | null = null;

  if (titleParam) {
    // 高速パス: layout.tsx から title + desc が直接来るケース
    title = titleParam;
    description = descParam ?? undefined;
  } else if (slugParam) {
    // フォールバック: 旧 URL や直接アクセスで slug のみのケース
    const resolved = await resolveFromSlug(slugParam);
    if (resolved) {
      title = resolved.title;
      description = resolved.description;
      thumbnailUrl = resolved.thumbnailUrl;
    }
  }

  const [fontData, avatarUrl] = await Promise.all([
    getFontData(),
    getAvatarBase64(),
  ]);

  const response = new ImageResponse(
    <OgCard
      title={title}
      description={description}
      thumbnailUrl={thumbnailUrl}
      avatarUrl={avatarUrl}
    />,
    {
      width: 1200,
      height: 630,
      fonts: [
        {
          name: "Yusei Magic",
          data: fontData,
          style: "normal" as const,
        },
      ],
    }
  );

  response.headers.set(
    "Cache-Control",
    "public, max-age=86400, stale-while-revalidate=604800"
  );

  return response;
}
