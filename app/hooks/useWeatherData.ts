import { useState, useEffect, useSyncExternalStore } from "react";
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

// sessionStorage はサーバーに存在しないので、キャッシュの読み出しは
// useSyncExternalStore で扱う。サーバー snapshot を null に固定することで
// 「サーバーは常に未取得 / クライアントはキャッシュ値」を hydration mismatch
// なしに切り替えられる（マウント後に setState する形だと effect 内 setState になる）。
let cacheSnapshot: WeatherData | null | undefined;
const cacheListeners = new Set<() => void>();

function getCacheSnapshot(): WeatherData | null {
  // getSnapshot は呼ぶたび同じ参照を返す必要があるため初回の結果を保持する
  if (cacheSnapshot === undefined) cacheSnapshot = loadCache()?.data ?? null;
  return cacheSnapshot;
}

function getServerCacheSnapshot(): WeatherData | null {
  return null;
}

function subscribeCache(listener: () => void): () => void {
  cacheListeners.add(listener);
  return () => {
    cacheListeners.delete(listener);
  };
}

/** 取得した天気をストアに反映して購読中のフックへ配る */
function publishWeather(data: WeatherData) {
  cacheSnapshot = data;
  cacheListeners.forEach((listener) => listener());
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
  const weatherData = useSyncExternalStore(
    subscribeCache,
    getCacheSnapshot,
    getServerCacheSnapshot
  );
  const [fetchSettled, setFetchSettled] = useState(false);

  useEffect(() => {
    // sessionStorage キャッシュが新鮮ならそれを使う（fetch ゼロ回）。
    // hydration 直後は render 時点の値がサーバー snapshot のことがあるため、
    // ここでは render 結果ではなくストアを直接読む。
    if (getCacheSnapshot()) return;

    const controller = new AbortController();
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    async function fetchWeather() {
      timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT);
      try {
        // 位置情報はサーバー側 (Vercel Edge) が x-vercel-ip-* ヘッダから取得するので
        // クライアントから座標を渡す必要なし。ipapi.co への往復も不要に。
        const weatherRes = await fetchWithTimeout(
          "/api/weather",
          controller.signal
        );
        const data: WeatherData = await weatherRes.json();

        if (!controller.signal.aborted) {
          saveCache(data);
          publishWeather(data);
        }
      } catch {
        // タイムアウト・ネットワークエラー → null のまま（時刻ベースの空にフォールバック）
      } finally {
        if (timeoutId !== null) clearTimeout(timeoutId);
        if (!controller.signal.aborted) setFetchSettled(true);
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

  return { weatherData, isLoading: weatherData === null && !fetchSettled };
}
