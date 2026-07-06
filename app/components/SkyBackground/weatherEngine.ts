import type { WeatherCondition } from "@/types/weather";

export type WeatherChannels = {
  rain: number;
  snow: number;
  cloudCover: number;
  darkness: number;
  lightning: number;
  wind: number;
};

const CHANNEL_KEYS: (keyof WeatherChannels)[] = [
  "rain",
  "snow",
  "cloudCover",
  "darkness",
  "lightning",
  "wind",
];

const RECIPES: Record<WeatherCondition, WeatherChannels> = {
  clear: {
    rain: 0,
    snow: 0,
    cloudCover: 0,
    darkness: 0,
    lightning: 0,
    wind: 0,
  },
  clouds: {
    rain: 0,
    snow: 0,
    cloudCover: 0.6,
    darkness: 0.15,
    lightning: 0,
    wind: 0.1,
  },
  drizzle: {
    rain: 0.3,
    snow: 0,
    cloudCover: 0.5,
    darkness: 0.3,
    lightning: 0,
    wind: 0.15,
  },
  rain: {
    rain: 1,
    snow: 0,
    cloudCover: 0.8,
    darkness: 0.7,
    lightning: 0,
    wind: 0.3,
  },
  thunderstorm: {
    rain: 1,
    snow: 0,
    cloudCover: 1,
    darkness: 0.9,
    lightning: 1,
    wind: 0.7,
  },
  snow: {
    rain: 0,
    snow: 1,
    cloudCover: 0.6,
    darkness: 0.6,
    lightning: 0,
    wind: 0.1,
  },
};

const TIME_CONSTANTS: Record<keyof WeatherChannels, number> = {
  cloudCover: 6000,
  darkness: 6000,
  rain: 2500,
  snow: 2500,
  lightning: 2000,
  wind: 1500,
};

export type WeatherTransition = {
  from: WeatherCondition;
  to: WeatherCondition;
};

export type WeatherEngineState = {
  current: WeatherChannels;
  target: WeatherChannels;
  condition: WeatherCondition;
  prevCondition: WeatherCondition | null;
  transition: WeatherTransition | null;
  /** ポインタ突風。符号付き（負は左向き）。addGust で加算され tick で減衰する */
  gust: number;
};

const SETTLE_EPSILON = 0.005;
const GUST_MAX = 1.5;
const GUST_TAU = 1200;

export function createWeatherEngine(
  initialCondition: WeatherCondition = "clear",
): WeatherEngineState {
  const recipe = RECIPES[initialCondition];
  return {
    current: { ...recipe },
    target: { ...recipe },
    condition: initialCondition,
    prevCondition: null,
    transition: null,
    gust: 0,
  };
}

export function setCondition(
  state: WeatherEngineState,
  condition: WeatherCondition,
): void {
  if (condition === state.condition) return;
  state.prevCondition = state.condition;
  state.condition = condition;
  state.target = { ...RECIPES[condition] };
  state.transition = { from: state.prevCondition, to: condition };
}

export function tick(state: WeatherEngineState, deltaMs: number): void {
  let settled = true;
  for (const key of CHANNEL_KEYS) {
    const target = state.target[key];
    const current = state.current[key];
    const diff = target - current;
    if (Math.abs(diff) < SETTLE_EPSILON) {
      state.current[key] = target;
    } else {
      const tau = TIME_CONSTANTS[key];
      state.current[key] += diff * (1 - Math.exp(-deltaMs / tau));
      settled = false;
    }
  }
  if (settled && state.transition) {
    state.transition = null;
  }

  if (state.gust !== 0) {
    state.gust *= Math.exp(-deltaMs / GUST_TAU);
    if (Math.abs(state.gust) < SETTLE_EPSILON) state.gust = 0;
  }
}

/** ポインタ速度由来の突風インパルスを加算する。impulse は符号付き */
export function addGust(state: WeatherEngineState, impulse: number): void {
  state.gust = Math.max(-GUST_MAX, Math.min(GUST_MAX, state.gust + impulse));
}

/** 天候レシピの風 + 突風を合成した実効風速（符号付き） */
export function getEffectiveWind(state: WeatherEngineState): number {
  return Math.max(
    -GUST_MAX,
    Math.min(GUST_MAX, state.current.wind + state.gust),
  );
}

export function getRecipe(
  condition: WeatherCondition,
): Readonly<WeatherChannels> {
  return RECIPES[condition];
}
