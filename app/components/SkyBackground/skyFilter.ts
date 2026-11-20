import { SKY_DITHER } from "@/app/config/skyShader";

/** 空の後処理フィルターの現在値。描画ループが毎フレーム読み、開発用チューナーが書き換える */
export type SkyFilter = {
  dither: boolean;
  levels: number;
  pixel: number;
  spread: number;
};

let current: SkyFilter = {
  dither: SKY_DITHER.enabled,
  levels: SKY_DITHER.levels,
  pixel: SKY_DITHER.pixel,
  spread: SKY_DITHER.spread,
};

export function getSkyFilter(): SkyFilter {
  return current;
}

export function setSkyFilter(patch: Partial<SkyFilter>): void {
  current = { ...current, ...patch };
}
