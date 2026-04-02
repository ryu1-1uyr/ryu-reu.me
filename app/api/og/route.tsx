import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

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

const fontOptions = async () => ({
  width: 1200 as const,
  height: 630 as const,
  fonts: [
    {
      name: "Yusei Magic",
      data: await fetch(FONT_URL).then((res) => res.arrayBuffer()),
      style: "normal" as const,
    },
  ],
});

export async function GET(request: NextRequest) {
  const slug = request.nextUrl.searchParams.get("slug");

  if (!slug) {
    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#232946",
            fontFamily: "Yusei Magic",
          }}
        >
          <span style={{ color: "#fffffe", fontSize: 48 }}>りゆうの実験場</span>
        </div>
      ),
      await fontOptions()
    );
  }

  const post = await prisma.post.findUnique({
    where: { slug: decodeURIComponent(slug) },
    select: { title: true, content: true },
  });

  if (!post) {
    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#232946",
            fontFamily: "Yusei Magic",
          }}
        >
          <span style={{ color: "#fffffe", fontSize: 48 }}>Not Found</span>
        </div>
      ),
      await fontOptions()
    );
  }

  const imageUrl = extractFirstImageUrl(post.content);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          backgroundColor: "#232946",
          fontFamily: "Yusei Magic",
          padding: 60,
        }}
      >
        {/* 左: タイトル + サイト名 */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            paddingRight: imageUrl ? 40 : 0,
          }}
        >
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span
              style={{
                color: "#fffffe",
                fontSize: 52,
                fontWeight: 700,
                lineHeight: 1.3,
                overflow: "hidden",
                display: "-webkit-box",
                WebkitLineClamp: 4,
                WebkitBoxOrient: "vertical",
              }}
            >
              {post.title}
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`${request.nextUrl.origin}/me.png`}
              alt=""
              style={{
                width: 48,
                height: 48,
                borderRadius: "50%",
              }}
            />
            <span
              style={{
                color: "#eebbc3",
                fontSize: 24,
              }}
            >
              りゆうの実験場
            </span>
          </div>
        </div>

        {/* 右: サムネイル（あれば） */}
        {imageUrl && (
          <div
            style={{
              width: 400,
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrl}
              alt=""
              style={{
                width: 400,
                height: 400,
                objectFit: "cover",
                borderRadius: 20,
              }}
            />
          </div>
        )}
      </div>
    ),
    await fontOptions()
  );
}
