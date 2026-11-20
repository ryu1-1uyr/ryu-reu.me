import { useSyncExternalStore } from "react";

/**
 * canvas アニメーションのコマ数の上限。既定は 24fps。
 * Start メニューの framerate.exe から切り替え、ブラウザに覚えさせる。
 * 各 rAF ループは createFrameGate() の関所を通ったフレームだけ進める。CSS アニメーションには効かない。
 */
export type FrameCap = 24 | 60 | null;

const STORAGE_KEY = "frame-cap";
const DEFAULT: FrameCap = 24;

let cap: FrameCap | undefined;
let changeId = 0;
const listeners = new Set<() => void>();

function readStored(): FrameCap {
  try {
    const v = window.localStorage.getItem(STORAGE_KEY);
    if (v === "60") return 60;
    if (v === "free") return null;
    return DEFAULT;
  } catch {
    return DEFAULT;
  }
}

/** 現在の上限 (fps)。null なら制限しない */
export function getFrameCap(): FrameCap {
  if (cap === undefined) {
    if (typeof window === "undefined") return DEFAULT;
    cap = readStored();
  }
  return cap;
}

export function setFrameCap(next: FrameCap): void {
  cap = next;
  try {
    window.localStorage.setItem(STORAGE_KEY, next === null ? "free" : String(next));
  } catch {
    // 保存できなくても今のページでは切り替わる
  }
  changeId += 1;
  listeners.forEach((l) => l());
}

/** 切り替えが起きるたびに増える番号 (演出の再生のきっかけ) */
export function getFrameCapChangeId(): number {
  return changeId;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useFrameCap(): FrameCap {
  return useSyncExternalStore(subscribe, getFrameCap, () => DEFAULT);
}

export function useFrameCapChangeId(): number {
  return useSyncExternalStore(subscribe, getFrameCapChangeId, () => 0);
}

/**
 * rAF のコールバックの先頭で呼ぶ関所。進めてよいフレームなら true。
 * 上限が 60Hz の約数でない (24fps など) ときは、2 回と 3 回の vsync を交互に挟んで平均を合わせる。
 */
export function createFrameGate(getCap: () => number | null = getFrameCap) {
  let last = -Infinity;
  return (now: number): boolean => {
    const fps = getCap();
    if (!fps) {
      last = now;
      return true;
    }
    const interval = 1000 / fps;
    // vsync のゆらぎで 1 フレーム取りこぼさないよう少し早めに許す
    if (now - last < interval - 2) return false;
    // 遅れを次に持ち越して平均のコマ数を保つ。ただし大きく遅れたら (タブ復帰など) 今を起点にする
    last = now - last > interval * 2 ? now : last + interval;
    return true;
  };
}
