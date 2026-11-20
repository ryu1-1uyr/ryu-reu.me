/**
 * 画面のガラスを滑り落ちる大粒の水滴のシミュレーション (描画はシェーダー側)。
 * 本物の水滴のように「止まる → 滑る」を繰り返し、ぶつかった粒は合体する。
 * 座標はすべて CSS px、y は下向き。
 */

export type GlassDrop = {
  x: number;
  y: number;
  /** 半径 (CSS px) */
  r: number;
  /** 落下速度 (px/s) */
  vy: number;
  /** 止まっている残り時間 (ms)。0 なら滑っている */
  stall: number;
  /** 通った跡 (拭われた筋) の上端の y */
  trailTop: number;
};

export type RainGlassState = {
  drops: GlassDrop[];
  /** 発生数の端数の持ち越し */
  spawnAcc: number;
};

const MIN_R = 4;
const MAX_R = 16;
/** 筋が残る最大の長さ (画面高さに対する割合) */
const TRAIL_MAX = 0.45;
/** 滑っている粒が止まる確率 (1 秒あたり) */
const STALL_CHANCE = 0.9;

export function createRainGlass(): RainGlassState {
  return { drops: [], spawnAcc: 0 };
}

export function tickRainGlass(
  state: RainGlassState,
  dtMs: number,
  intensity: number,
  spawnPerSec: number,
  w: number,
  h: number,
  maxDrops: number,
  rand: () => number = Math.random,
): void {
  const dt = dtMs / 1000;

  // 発生: 雨が強いほど多い。上限に達したら持ち越さない
  if (intensity > 0) {
    state.spawnAcc += intensity * spawnPerSec * dt;
    while (state.spawnAcc >= 1) {
      state.spawnAcc -= 1;
      if (state.drops.length >= maxDrops) {
        state.spawnAcc = 0;
        break;
      }
      const y = rand() * h * 0.7;
      state.drops.push({
        x: rand() * w,
        y,
        r: 6 + rand() * 6,
        vy: 0,
        stall: 200 + rand() * 800,
        trailTop: y,
      });
    }
  } else {
    state.spawnAcc = 0;
  }

  for (const d of state.drops) {
    if (d.stall > 0) {
      d.stall -= dtMs;
      d.vy = 0;
      continue;
    }
    // 大きい粒ほど速い
    const target = d.r * 14;
    d.vy += (target - d.vy) * Math.min(1, dt * 6);
    const dy = d.vy * dt;
    d.y += dy;
    d.x += (rand() - 0.5) * 0.6;
    // 筋に水を置いていくぶん少しずつ痩せる
    d.r = Math.max(MIN_R, d.r - dy * 0.004);
    if (d.y - d.trailTop > h * TRAIL_MAX) d.trailTop = d.y - h * TRAIL_MAX;
    if (rand() < STALL_CHANCE * dt) d.stall = 80 + rand() * 400;
  }

  mergeDrops(state.drops);
  state.drops = state.drops.filter((d) => d.y - d.r <= h);
}

/** 重なった粒を下側の粒に吸収させる (面積を保存) */
function mergeDrops(drops: GlassDrop[]): void {
  for (let i = 0; i < drops.length; i++) {
    const a = drops[i];
    if (a.r <= 0) continue;
    for (let j = i + 1; j < drops.length; j++) {
      const b = drops[j];
      if (b.r <= 0) continue;
      if (Math.hypot(a.x - b.x, a.y - b.y) > (a.r + b.r) * 0.7) continue;
      const [keep, gone] = a.y >= b.y ? [a, b] : [b, a];
      keep.r = Math.min(MAX_R, Math.hypot(keep.r, gone.r));
      keep.trailTop = Math.min(keep.trailTop, gone.trailTop);
      keep.stall = 0;
      gone.r = 0;
    }
  }
  for (let i = drops.length - 1; i >= 0; i--) {
    if (drops[i].r <= 0) drops.splice(i, 1);
  }
}
