"use client";

import { usePathname } from "next/navigation";
import { useSkyPhase } from "@/app/hooks/useSkyPhase";
import { useWeatherData } from "@/app/hooks/useWeatherData";
import { useWeatherOverride } from "@/app/contexts/WeatherOverride";
import { useSkyDrawings } from "@/app/contexts/SkyDrawings";
import SkyCanvas from "./SkyCanvas";

// コンテンツが主役のページでは 30fps に落として CPU 負荷を下げる
const LOW_FPS_PATHS = ["/posts/"];

export default function SkyBackground() {
  const pathname = usePathname();
  const { weatherData, isLoading } = useWeatherData();
  const { override } = useWeatherOverride();
  const { drawings } = useSkyDrawings();
  const { phase, progress } = useSkyPhase(
    weatherData?.sunrise,
    weatherData?.sunset
  );

  const weatherCondition =
    override ?? (!isLoading && weatherData ? weatherData.condition : "clear");

  const targetFps = LOW_FPS_PATHS.some((p) => pathname.startsWith(p)) ? 30 : 60;

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
        targetFps={targetFps}
      />
    </div>
  );
}
