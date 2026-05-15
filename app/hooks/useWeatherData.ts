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

// ブラウザがアイドル時間に入ってから実行（メイン描画を邪魔しない）
// requestIdleCallback が未対応なら setTimeout でフォールバック
type IdleHandle = { type: "idle"; id: number } | { type: "timeout"; id: number };

function scheduleIdle(cb: () => void): IdleHandle {
  if (typeof window === "undefined") return { type: "timeout", id: 0 };
  const ric = (window as Window & {
    requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
  }).requestIdleCallback;
  if (ric) {
    return { type: "idle", id: ric(cb, { timeout: 3000 }) };
  }
  return { type: "timeout", id: window.setTimeout(cb, 200) };
}

function cancelIdle(handle: IdleHandle) {
  if (typeof window === "undefined") return;
  if (handle.type === "idle") {
    const cic = (window as Window & {
      cancelIdleCallback?: (id: number) => void;
    }).cancelIdleCallback;
    cic?.(handle.id);
  } else {
    clearTimeout(handle.id);
  }
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
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    async function fetchWeather() {
      timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT);
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
        if (timeoutId !== null) clearTimeout(timeoutId);
        if (!controller.signal.aborted) setIsLoading(false);
      }
    }

    // 装飾用 API なのでメイン描画を邪魔しない。アイドル時間まで待ってから fetch。
    const idleHandle = scheduleIdle(() => {
      if (!controller.signal.aborted) fetchWeather();
    });

    return () => {
      cancelIdle(idleHandle);
      controller.abort();
      if (timeoutId !== null) clearTimeout(timeoutId);
    };
  }, []);

  return { weatherData, isLoading };
}
