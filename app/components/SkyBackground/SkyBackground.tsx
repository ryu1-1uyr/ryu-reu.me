"use client";

import { useSkyPhase } from "@/app/hooks/useSkyPhase";
import { useWeatherData } from "@/app/hooks/useWeatherData";
import SkyCanvas from "./SkyCanvas";

export default function SkyBackground() {
  const { weatherData, isLoading } = useWeatherData();
  const { phase, progress } = useSkyPhase(
    weatherData?.sunrise,
    weatherData?.sunset
  );

  // 天気データ読み込み中は時刻ベースの空だけ表示
  const weatherCondition =
    !isLoading && weatherData ? weatherData.condition : "clear";

  return (
    <div
      className="fixed inset-0 -z-10 pointer-events-none"
      aria-hidden="true"
    >
      <SkyCanvas
        phase={phase}
        phaseProgress={progress}
        weatherCondition={weatherCondition}
      />
    </div>
  );
}
