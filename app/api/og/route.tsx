import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import { readFile } from "fs/promises";
import path from "path";
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

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const title = searchParams.get("title") ?? "りゆうの実験場";
  const description = searchParams.get("desc") ?? undefined;

  const [fontData, avatarUrl] = await Promise.all([
    getFontData(),
    getAvatarBase64(),
  ]);

  const response = new ImageResponse(
    <OgCard title={title} description={description} avatarUrl={avatarUrl} />,
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
