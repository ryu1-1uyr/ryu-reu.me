import { useState, useEffect } from "react";
import type { SkyPhase } from "@/types/weather";

type SkyPhaseResult = {
  phase: SkyPhase;
  progress: number; // 0〜1 フェーズ内の進行度
};

function calcPhase(
  now: Date,
  sunriseUnix?: number,
  sunsetUnix?: number
): SkyPhaseResult {
  const h = now.getHours();
  const m = now.getMinutes();
  const totalMin = h * 60 + m;

  // 天気APIのsunrise/sunsetがあればそれを使う、なければ 6:00 / 18:00
  let sunriseMin = 6 * 60;
  let sunsetMin = 18 * 60;

  if (sunriseUnix) {
    const sr = new Date(sunriseUnix * 1000);
    sunriseMin = sr.getHours() * 60 + sr.getMinutes();
  }
  if (sunsetUnix) {
    const ss = new Date(sunsetUnix * 1000);
    sunsetMin = ss.getHours() * 60 + ss.getMinutes();
  }

  const sunriseStart = sunriseMin - 30;
  const sunriseEnd = sunriseMin + 60;
  const sunsetStart = sunsetMin - 60;
  const sunsetEnd = sunsetMin + 30;

  if (totalMin >= sunriseStart && totalMin < sunriseEnd) {
    return {
      phase: "sunrise",
      progress: (totalMin - sunriseStart) / (sunriseEnd - sunriseStart),
    };
  }
  if (totalMin >= sunriseEnd && totalMin < sunsetStart) {
    return {
      phase: "day",
      progress: (totalMin - sunriseEnd) / (sunsetStart - sunriseEnd),
    };
  }
  if (totalMin >= sunsetStart && totalMin < sunsetEnd) {
    return {
      phase: "sunset",
      progress: (totalMin - sunsetStart) / (sunsetEnd - sunsetStart),
    };
  }
  // night
  const nightDuration =
    24 * 60 - sunsetEnd + sunriseStart;
  const nightElapsed =
    totalMin >= sunsetEnd
      ? totalMin - sunsetEnd
      : totalMin + (24 * 60 - sunsetEnd);
  return {
    phase: "night",
    progress: nightElapsed / nightDuration,
  };
}

export function useSkyPhase(
  sunriseUnix?: number,
  sunsetUnix?: number
): SkyPhaseResult {
  const [result, setResult] = useState<SkyPhaseResult>(() =>
    calcPhase(new Date(), sunriseUnix, sunsetUnix)
  );

  useEffect(() => {
    const update = () =>
      setResult(calcPhase(new Date(), sunriseUnix, sunsetUnix));
    update();
    const id = setInterval(update, 60_000);
    return () => clearInterval(id);
  }, [sunriseUnix, sunsetUnix]);

  return result;
}
