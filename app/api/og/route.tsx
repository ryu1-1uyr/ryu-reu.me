import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import { OgCard } from "@/app/components/OgCard/OgCard";

export const runtime = "edge";

// ビルド時にバンドルされる（実行時のネットワーク・ディスクI/O なし）
const fontData = fetch(
  new URL("../../../public/fonts/YuseiMagic-Regular.ttf", import.meta.url)
).then((res) => res.arrayBuffer());

function arrayBufferToBase64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let binary = "";
  // 一度に大量スプレッドするとスタック溢れるので、チャンクに分けて処理
  const chunkSize = 8192;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

const avatarData = fetch(
  new URL("../../../public/me.png", import.meta.url)
).then(async (res) => {
  const buf = await res.arrayBuffer();
  return `data:image/png;base64,${arrayBufferToBase64(buf)}`;
});

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const title = searchParams.get("title") ?? "りゆうの実験場";
  const description = searchParams.get("desc") ?? undefined;

  const [font, avatar] = await Promise.all([fontData, avatarData]);

  const response = new ImageResponse(
    <OgCard title={title} description={description} avatarUrl={avatar} />,
    {
      width: 1200,
      height: 630,
      fonts: [
        {
          name: "Yusei Magic",
          data: font,
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
