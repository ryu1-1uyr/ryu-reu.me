import { useState, useEffect, useRef } from "react";
import type { WeatherData } from "@/types/weather";

type WeatherResult = {
  weatherData: WeatherData | null;
  isLoading: boolean;
};

const CACHE_DURATION = 10 * 60 * 1000; // 10分

export function useWeatherData(): WeatherResult {
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const cacheRef = useRef<{ data: WeatherData; fetchedAt: number } | null>(
    null
  );

  useEffect(() => {
    // キャッシュが新鮮ならスキップ
    if (
      cacheRef.current &&
      Date.now() - cacheRef.current.fetchedAt < CACHE_DURATION
    ) {
      setWeatherData(cacheRef.current.data);
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    async function fetchWeather() {
      try {
        // IP ベースで位置推定（許可ダイアログなし）
        const geoRes = await fetch("https://ipapi.co/json/");
        if (!geoRes.ok) throw new Error("IP geolocation failed");
        const geo = await geoRes.json();
        const { latitude, longitude } = geo;

        if (!latitude || !longitude) throw new Error("No coordinates");

        const weatherRes = await fetch(
          `/api/weather?lat=${latitude}&lon=${longitude}`
        );
        if (!weatherRes.ok) throw new Error("Weather API failed");
        const data: WeatherData = await weatherRes.json();

        if (!cancelled) {
          cacheRef.current = { data, fetchedAt: Date.now() };
          setWeatherData(data);
        }
      } catch {
        // 失敗しても null のまま → 時刻だけの空にフォールバック
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    fetchWeather();
    return () => {
      cancelled = true;
    };
  }, []);

  return { weatherData, isLoading };
}
