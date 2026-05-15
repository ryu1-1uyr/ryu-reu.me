import { NextRequest, NextResponse } from "next/server";
import type { WeatherCondition } from "@/types/weather";

// Edge Runtime で動かして cold start を最小化。
// Vercel Edge は x-vercel-ip-latitude / x-vercel-ip-longitude ヘッダを自動注入する。
export const runtime = "edge";

// 東京駅をデフォルトに（Vercel が geolocation を提供できない場合のフォールバック）
const DEFAULT_LAT = 35.6812;
const DEFAULT_LON = 139.7671;

function mapCondition(id: number): WeatherCondition {
  if (id >= 200 && id < 300) return "thunderstorm";
  if (id >= 300 && id < 400) return "drizzle";
  if (id >= 500 && id < 600) return "rain";
  if (id >= 600 && id < 700) return "snow";
  if (id >= 801) return "clouds";
  return "clear";
}

/** 緯度経度を 0.1度（約 11km）に丸めて CDN キャッシュキーを共有しやすくする */
function roundCoord(value: number): number {
  return Math.round(value * 10) / 10;
}

export async function GET(request: NextRequest) {
  // 位置情報の優先順位:
  // 1. Vercel Edge が自動注入する geolocation ヘッダ
  // 2. クエリパラメータ (旧クライアントとの互換性)
  // 3. デフォルト (東京駅)
  const headerLat = request.headers.get("x-vercel-ip-latitude");
  const headerLon = request.headers.get("x-vercel-ip-longitude");
  const queryLat = request.nextUrl.searchParams.get("lat");
  const queryLon = request.nextUrl.searchParams.get("lon");

  const lat = parseFloat(headerLat ?? queryLat ?? "");
  const lon = parseFloat(headerLon ?? queryLon ?? "");

  const finalLat = Number.isFinite(lat) ? roundCoord(lat) : DEFAULT_LAT;
  const finalLon = Number.isFinite(lon) ? roundCoord(lon) : DEFAULT_LON;

  const apiKey = process.env.OPENWEATHERMAP_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Weather API key not configured" },
      { status: 500 }
    );
  }

  try {
    const res = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${finalLat}&lon=${finalLon}&appid=${apiKey}`,
      { next: { revalidate: 600 } }
    );

    if (!res.ok) {
      return NextResponse.json({ error: "Weather API error" }, { status: 502 });
    }

    const data = await res.json();
    const conditionId = data.weather?.[0]?.id ?? 800;

    return NextResponse.json(
      {
        condition: mapCondition(conditionId),
        conditionId,
        sunrise: data.sys?.sunrise ?? 0,
        sunset: data.sys?.sunset ?? 0,
        temp: data.main?.temp ?? 0,
      },
      {
        headers: {
          // CDN にも 10分キャッシュ。同じ丸めた座標のリクエストで共有される。
          "Cache-Control":
            "public, max-age=600, s-maxage=600, stale-while-revalidate=3600",
        },
      }
    );
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch weather" },
      { status: 502 }
    );
  }
}
