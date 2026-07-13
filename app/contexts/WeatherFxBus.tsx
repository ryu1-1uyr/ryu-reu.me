"use client";

import { createContext, useContext, useCallback, useRef } from "react";
import {
  createWeatherEngine,
  type WeatherEngineState,
} from "@/app/components/SkyBackground/weatherEngine";
import type { SnowFxState } from "@/app/components/WeatherFxOverlay/snowFx";

type WeatherFxBusContextType = {
  /** 共有天候エンジン。tick を呼んで良いのは WeatherFxOverlay の rAF ループのみ。他の購読者は読み取り専用 */
  getEngine: () => WeatherEngineState;
  /** WeatherFxOverlay がマウント中のみ非 null */
  getSnowFx: () => SnowFxState | null;
  setSnowFx: (s: SnowFxState | null) => void;
};

const WeatherFxBusContext = createContext<WeatherFxBusContextType | null>(
  null,
);

export function WeatherFxBusProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const engineRef = useRef<WeatherEngineState | null>(null);
  if (engineRef.current === null) {
    engineRef.current = createWeatherEngine();
  }

  const snowFxRef = useRef<SnowFxState | null>(null);

  const getEngine = useCallback(() => engineRef.current!, []);

  const getSnowFx = useCallback(() => snowFxRef.current, []);

  const setSnowFx = useCallback((s: SnowFxState | null) => {
    snowFxRef.current = s;
  }, []);

  return (
    <WeatherFxBusContext.Provider value={{ getEngine, getSnowFx, setSnowFx }}>
      {children}
    </WeatherFxBusContext.Provider>
  );
}

export function useWeatherFxBus() {
  return useContext(WeatherFxBusContext);
}
