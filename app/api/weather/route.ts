import { NextRequest, NextResponse } from "next/server";
import type { WeatherCondition } from "@/types/weather";

function mapCondition(id: number): WeatherCondition {
  if (id >= 200 && id < 300) return "thunderstorm";
  if (id >= 300 && id < 400) return "drizzle";
  if (id >= 500 && id < 600) return "rain";
  if (id >= 600 && id < 700) return "snow";
  if (id >= 801) return "clouds";
  return "clear";
}

export async function GET(request: NextRequest) {
  const lat = request.nextUrl.searchParams.get("lat");
  const lon = request.nextUrl.searchParams.get("lon");

  if (!lat || !lon) {
    return NextResponse.json(
      { error: "lat and lon are required" },
      { status: 400 }
    );
  }

  const apiKey = process.env.OPENWEATHERMAP_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Weather API key not configured" },
      { status: 500 }
    );
  }

  try {
    const res = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}`,
      { next: { revalidate: 600 } }
    );

    if (!res.ok) {
      return NextResponse.json(
        { error: "Weather API error" },
        { status: 502 }
      );
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
          "Cache-Control": "public, max-age=600",
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
