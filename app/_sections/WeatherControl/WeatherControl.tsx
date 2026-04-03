"use client";

import { useWeatherOverride } from "@/app/contexts/WeatherOverride";
import type { WeatherCondition } from "@/types/weather";

const WEATHER_OPTIONS: {
  emoji: string;
  label: string;
  condition: WeatherCondition;
}[] = [
  { emoji: "☀️", label: "はれ", condition: "clear" },
  { emoji: "☁️", label: "くもり", condition: "clouds" },
  { emoji: "☔️", label: "あめ", condition: "rain" },
  { emoji: "❄️", label: "ゆき", condition: "snow" },
  { emoji: "⚡️", label: "かみなり", condition: "thunderstorm" },
];

export default function WeatherControl() {
  const { override, setOverride } = useWeatherOverride();

  return (
    <div className="text-elements-headline px-5 py-6 space-y-4">
      <p className="text-sm text-elements-paragraph leading-relaxed">
        空の天気を操作できるよ。
      </p>
      {override && (
        <p className="text-xs text-elements-button">
          現在: {WEATHER_OPTIONS.find((o) => o.condition === override)?.label}
        </p>
      )}
      <div className="flex flex-wrap gap-1">
        {WEATHER_OPTIONS.map((opt) => {
          const isActive = override === opt.condition;
          return (
            <button
              key={opt.condition}
              type="button"
              onClick={() => setOverride(isActive ? null : opt.condition)}
              className={`
                relative group flex items-center justify-center
                w-12 h-12 rounded-xl
                border text-2xl
                transition-all
                ${
                  isActive
                    ? "bg-elements-button/30 border-elements-button shadow-[0_0_8px_rgba(238,187,195,0.4)] scale-110"
                    : "bg-illustration-stroke border-elements-paragraph/20 hover:border-elements-button/50"
                }
              `}
            >
              {opt.emoji}
              <span className="pointer-events-none absolute bottom-full left-1/2 mb-2 -translate-x-1/2 whitespace-nowrap rounded-md border border-elements-paragraph/20 bg-illustration-stroke px-2 py-1 text-xs text-elements-paragraph opacity-0 transition-opacity duration-150 group-hover:opacity-100">
                {opt.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
