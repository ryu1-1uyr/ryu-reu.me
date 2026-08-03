import { addGust, type WeatherEngineState } from "./weatherEngine";

/** 1イベントあたりのインパルス上限。連続ムーブで積み上がる */
const IMPULSE_CAP = 0.12;
/** ポインタ速度 (px/ms) → インパルスへの変換係数 */
const VELOCITY_SCALE = 0.05;
/** これより間隔が空いたサンプルは速度計算に使わない (ms) */
const MAX_SAMPLE_GAP = 100;

// 傘モード（umbrella.exe）中はポインタ由来の突風を止める。
// attachGustTracker は複数箇所（SkyCanvas / WeatherFxOverlay）から使われるため、
// モジュールレベルの共有フラグで全リスナーを一括制御する。
let suppressed = false;

/** ポインタ連動の突風を一時停止/再開する */
export function setGustSuppressed(value: boolean): void {
  suppressed = value;
}

/**
 * pointermove からポインタの水平速度を計測し、
 * エンジンの gust へ突風インパルスとして流し込む。
 * 返り値の関数でリスナーを解除する。
 */
export function attachGustTracker(engine: WeatherEngineState): () => void {
  let lastX = 0;
  let lastT = 0;
  let hasLast = false;

  const onMove = (e: PointerEvent) => {
    if (suppressed) {
      // 再開時に大きな見かけ速度が出ないようサンプルを捨てる
      hasLast = false;
      return;
    }
    const now = performance.now();
    if (hasLast) {
      const deltaT = now - lastT;
      if (deltaT > 0 && deltaT < MAX_SAMPLE_GAP) {
        const vx = (e.clientX - lastX) / deltaT;
        const impulse = Math.max(
          -IMPULSE_CAP,
          Math.min(IMPULSE_CAP, vx * VELOCITY_SCALE),
        );
        addGust(engine, impulse);
      }
    }
    lastX = e.clientX;
    lastT = now;
    hasLast = true;
  };

  window.addEventListener("pointermove", onMove, { passive: true });
  return () => window.removeEventListener("pointermove", onMove);
}
