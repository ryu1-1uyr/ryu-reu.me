"use client";

import { createContext, useContext, useState } from "react";
import type { WeatherCondition } from "@/types/weather";

type WeatherOverrideContextType = {
  override: WeatherCondition | null;
  setOverride: (condition: WeatherCondition | null) => void;
};

const WeatherOverrideContext =
  createContext<WeatherOverrideContextType | null>(null);

export function WeatherOverrideProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [override, setOverride] = useState<WeatherCondition | null>(null);

  return (
    <WeatherOverrideContext.Provider value={{ override, setOverride }}>
      {children}
    </WeatherOverrideContext.Provider>
  );
}

export function useWeatherOverride() {
  const ctx = useContext(WeatherOverrideContext);
  if (!ctx)
    throw new Error("useWeatherOverride must be used within provider");
  return ctx;
}
