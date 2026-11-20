import { useSyncExternalStore } from "react";
import { SKY_SWAP } from "@/app/config/skyShader";

/**
 * 空の描画方式。"shader" は WebGL の雲・ガラスの雨粒・後処理フィルターを使い、
 * "2d" は従来の Canvas 2D だけで描く。Start メニューから切り替え、ブラウザに覚えさせる。
 * 切り替えは走査線で上から積み替える演出になる。描画ループは getShaderReveal() を毎フレーム読み、
 * 画面のうちシェーダーで描く割合 (上から 0..1) を得る。
 */
export type SkyRenderer = "shader" | "2d";

const STORAGE_KEY = "sky-renderer";
const DEFAULT: SkyRenderer = "shader";

let current: SkyRenderer | null = null;
const listeners = new Set<() => void>();

/** 走査の進行。途中で反転しても、その位置から逆向きに進む */
type Sweep = { from: number; to: number; start: number; duration: number };
let sweep: Sweep | null = null;
let sweepId = 0;

// MOTION_EASE.travel (cubic-bezier(0.65, 0, 0.35, 1)) に近い加減速
function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function readStored(): SkyRenderer {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "2d" ? "2d" : "shader";
  } catch {
    return DEFAULT;
  }
}

export function getSkyRenderer(): SkyRenderer {
  if (current === null) {
    if (typeof window === "undefined") return DEFAULT;
    current = readStored();
  }
  return current;
}

/** 画面のうちシェーダーで描く割合 (上端から。0 = 全部 2D, 1 = 全部シェーダー) */
export function getShaderReveal(now: number = performance.now()): number {
  if (!sweep) return getSkyRenderer() === "shader" ? 1 : 0;
  if (sweep.duration <= 0) return sweep.to;
  const p = Math.min(1, Math.max(0, (now - sweep.start) / sweep.duration));
  return sweep.from + (sweep.to - sweep.from) * easeInOutCubic(p);
}

/** 切り替えが起きるたびに増える番号 (演出の再生のきっかけ) */
export function getSweepId(): number {
  return sweepId;
}

export function setSkyRenderer(next: SkyRenderer): void {
  const now = performance.now();
  const from = getShaderReveal(now);
  const to = next === "shader" ? 1 : 0;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  sweep = {
    from,
    to,
    start: now,
    duration: reduce ? 0 : SKY_SWAP.sweepMs * Math.abs(to - from),
  };
  sweepId += 1;
  current = next;
  try {
    window.localStorage.setItem(STORAGE_KEY, next);
  } catch {
    // 保存できなくても今のページでは切り替わる
  }
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useSkyRenderer(): SkyRenderer {
  return useSyncExternalStore(subscribe, getSkyRenderer, () => DEFAULT);
}

export function useSweepId(): number {
  return useSyncExternalStore(subscribe, getSweepId, () => 0);
}
