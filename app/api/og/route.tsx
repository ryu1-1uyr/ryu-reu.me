import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import { readFile } from "fs/promises";
import path from "path";
import { OgCard } from "@/app/components/OgCard/OgCard";

export const runtime = "nodejs";

// キャッシュ: サーバー起動後に一度だけ読み込む
let fontCache: ArrayBuffer | null = null;

async function getFontData(): Promise<ArrayBuffer> {
  if (fontCache) return fontCache;
  const fontPath = path.join(process.cwd(), "public/fonts/YuseiMagic-Regular.ttf");
  const data = await readFile(fontPath);
  fontCache = data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength) as ArrayBuffer;
  return fontCache;
}

const CACHE_HEADERS = {
  "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
};

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const title = searchParams.get("title") ?? "りゆうの実験場";
  const description = searchParams.get("desc") ?? undefined;
  const avatarUrl = `${origin}/me.png`;

  const fontData = await getFontData();

  const options = {
    width: 1200 as const,
    height: 630 as const,
    fonts: [
      {
        name: "Yusei Magic",
        data: fontData,
        style: "normal" as const,
      },
    ],
  };

  const response = new ImageResponse(
    <OgCard title={title} description={description} avatarUrl={avatarUrl} />,
    options
  );

  // Vercel Edge Cache に乗せる
  response.headers.set("Cache-Control", CACHE_HEADERS["Cache-Control"]);

  return response;
}
