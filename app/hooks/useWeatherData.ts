import { useState, useEffect } from "react";
import type { WeatherData } from "@/types/weather";

type WeatherResult = {
  weatherData: WeatherData | null;
  isLoading: boolean;
};

const CACHE_DURATION = 10 * 60 * 1000; // 10分
const FETCH_TIMEOUT = 5_000; // 5秒でタイムアウト
const STORAGE_KEY = "weather-cache";

// sessionStorage からキャッシュ読み出し
function loadCache(): { data: WeatherData; fetchedAt: number } | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (Date.now() - parsed.fetchedAt < CACHE_DURATION) return parsed;
    return null;
  } catch {
    return null;
  }
}

function saveCache(data: WeatherData) {
  try {
    sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ data, fetchedAt: Date.now() })
    );
  } catch {
    // sessionStorage が使えなくても無視
  }
}

// タイムアウト付き fetch
async function fetchWithTimeout(
  url: string,
  signal: AbortSignal
): Promise<Response> {
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res;
}

export function useWeatherData(): WeatherResult {
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // sessionStorage キャッシュが新鮮ならそれを使う（fetch ゼロ回）
    const cached = loadCache();
    if (cached) {
      setWeatherData(cached.data);
      setIsLoading(false);
      return;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

    async function fetchWeather() {
      try {
        const geoRes = await fetchWithTimeout(
          "https://ipapi.co/json/",
          controller.signal
        );
        const geo = await geoRes.json();
        const { latitude, longitude } = geo;
        if (!latitude || !longitude) throw new Error("No coordinates");

        const weatherRes = await fetchWithTimeout(
          `/api/weather?lat=${latitude}&lon=${longitude}`,
          controller.signal
        );
        const data: WeatherData = await weatherRes.json();

        if (!controller.signal.aborted) {
          saveCache(data);
          setWeatherData(data);
        }
      } catch {
        // タイムアウト・ネットワークエラー → null のまま（時刻ベースの空にフォールバック）
      } finally {
        clearTimeout(timeoutId);
        if (!controller.signal.aborted) setIsLoading(false);
      }
    }

    fetchWeather();

    return () => {
      controller.abort();
      clearTimeout(timeoutId);
    };
  }, []);

  return { weatherData, isLoading };
}
