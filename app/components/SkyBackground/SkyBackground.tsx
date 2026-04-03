"use client";

import { useSkyPhase } from "@/app/hooks/useSkyPhase";
import { useWeatherData } from "@/app/hooks/useWeatherData";
import { useWeatherOverride } from "@/app/contexts/WeatherOverride";
import { useSkyDrawings } from "@/app/contexts/SkyDrawings";
import SkyCanvas from "./SkyCanvas";

export default function SkyBackground() {
  const { weatherData, isLoading } = useWeatherData();
  const { override } = useWeatherOverride();
  const { drawings } = useSkyDrawings();
  const { phase, progress } = useSkyPhase(
    weatherData?.sunrise,
    weatherData?.sunset
  );

  // オーバーライドがあればそっち優先、なければ API の天気 or デフォルト
  const weatherCondition =
    override ?? (!isLoading && weatherData ? weatherData.condition : "clear");

  return (
    <div
      className="fixed inset-0 -z-10 pointer-events-none"
      aria-hidden="true"
    >
      <SkyCanvas
        phase={phase}
        phaseProgress={progress}
        weatherCondition={weatherCondition}
        skyDrawings={drawings}
      />
    </div>
  );
}
