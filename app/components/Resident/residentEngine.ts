/**
 * デスクトップの住人（マスコット）の行動エンジン。
 * DOM に依存しない純粋 TS。足場矩形の配列と経過時間だけで状態を進める。
 * 座標はすべて「足元中心」基準（描画側でスプライトの原点に変換する）。
 */

export type Platform = {
  id: string;
  /** 上辺の y 座標（足がここに乗る） */
  y: number;
  x: number;
  width: number;
};

export type ResidentStateName = "idle" | "walk" | "fall" | "land";

export type ResidentState = {
  x: number;
  y: number;
  /** fall 中の速度。それ以外の状態では使わない */
  vx: number;
  vy: number;
  facing: 1 | -1;
  name: ResidentStateName;
  /** 現在の状態の経過時間 (ms) */
  stateTime: number;
  /** idle / walk / land の継続予定時間 (ms) */
  stateDuration: number;
  /** 乗っている足場の id（fall 中は null） */
  platformId: string | null;
};

export type Viewport = { width: number; height: number };

export const WALK_SPEED = 36; // px/s
export const GRAVITY = 1800; // px/s^2
export const MAX_FALL_SPEED = 800; // px/s
export const LAND_DURATION = 280; // ms
export const EDGE_MARGIN = 6; // 足場端から足元中心までの最小距離
/** 足場の端に着いたとき引き返す確率（残りは踏み外して落ちる） */
export const EDGE_TURN_PROBABILITY = 0.6;

const IDLE_DURATION_RANGE: [number, number] = [1200, 4500];
const WALK_DURATION_RANGE: [number, number] = [2000, 5500];

type Rand = () => number;

function randomIn(range: [number, number], rand: Rand): number {
  return range[0] + (range[1] - range[0]) * rand();
}

/** 画面上部の外から落ちてくる状態で生成する */
export function createResident(viewport: Viewport, rand: Rand = Math.random): ResidentState {
  return {
    x: viewport.width * (0.25 + rand() * 0.5),
    y: -40,
    vx: 0,
    vy: 0,
    facing: rand() < 0.5 ? -1 : 1,
    name: "fall",
    stateTime: 0,
    stateDuration: 0,
    platformId: null,
  };
}

function enterState(
  state: ResidentState,
  name: ResidentStateName,
  duration: number,
): void {
  state.name = name;
  state.stateTime = 0;
  state.stateDuration = duration;
}

function enterFall(state: ResidentState, vx: number, vy = 0): void {
  enterState(state, "fall", 0);
  state.platformId = null;
  state.vx = vx;
  state.vy = vy;
}

/** クリック等で小さく跳ねさせる。落下中は無視 */
export function hop(state: ResidentState): void {
  if (state.name === "fall") return;
  enterFall(state, state.facing * 30, -420);
}

function walkRange(p: Platform): [number, number] {
  const min = p.x + EDGE_MARGIN;
  const max = p.x + p.width - EDGE_MARGIN;
  // 足場が極端に狭い場合は中央に立たせる
  return min <= max ? [min, max] : [p.x + p.width / 2, p.x + p.width / 2];
}

export function tick(
  state: ResidentState,
  deltaMs: number,
  platforms: Platform[],
  viewport: Viewport,
  rand: Rand = Math.random,
): void {
  const dt = deltaMs / 1000;
  state.stateTime += deltaMs;

  if (state.name === "fall") {
    state.vy = Math.min(state.vy + GRAVITY * dt, MAX_FALL_SPEED);
    const prevY = state.y;
    state.y += state.vy * dt;
    state.x = Math.max(0, Math.min(viewport.width, state.x + state.vx * dt));

    // 下降中のみ着地判定: この tick で上辺を上から厳密にまたいだ足場のうち最も高いものに乗る
    // （prevY < p.y の厳密比較にすることで、端から踏み外した直後に同じ高さの足場へ
    //   即再着地するのを防ぐ）
    if (state.vy > 0) {
      let target: Platform | null = null;
      for (const p of platforms) {
        if (state.x < p.x || state.x > p.x + p.width) continue;
        if (prevY < p.y && state.y >= p.y) {
          if (!target || p.y < target.y) target = p;
        }
      }
      if (target) {
        state.y = target.y;
        state.vx = 0;
        state.vy = 0;
        state.platformId = target.id;
        enterState(state, "land", LAND_DURATION);
      }
    }
    return;
  }

  // --- 接地状態 (idle / walk / land) ---
  const platform = platforms.find((p) => p.id === state.platformId);
  if (!platform) {
    // 足場が消えた（ウィンドウが閉じた等）
    enterFall(state, 0, 0);
    return;
  }

  // 足場に追従する（ドラッグ中のウィンドウには乗ったまま運ばれる）
  state.y = platform.y;
  const [minX, maxX] = walkRange(platform);
  state.x = Math.max(minX, Math.min(maxX, state.x));

  if (state.name === "land") {
    if (state.stateTime >= state.stateDuration) {
      enterState(state, "idle", randomIn(IDLE_DURATION_RANGE, rand));
    }
    return;
  }

  if (state.name === "idle") {
    if (state.stateTime >= state.stateDuration) {
      if (rand() < 0.3) state.facing = state.facing === 1 ? -1 : 1;
      enterState(state, "walk", randomIn(WALK_DURATION_RANGE, rand));
    }
    return;
  }

  // walk
  const nextX = state.x + state.facing * WALK_SPEED * dt;
  if (nextX < minX || nextX > maxX) {
    // 画面端（地面の両端）では必ず引き返す。足場の端では確率で踏み外す
    const atViewportEdge = nextX < EDGE_MARGIN || nextX > viewport.width - EDGE_MARGIN;
    if (!atViewportEdge && rand() >= EDGE_TURN_PROBABILITY) {
      enterFall(state, state.facing * WALK_SPEED);
      return;
    }
    state.facing = state.facing === 1 ? -1 : 1;
  } else {
    state.x = nextX;
  }

  if (state.stateTime >= state.stateDuration) {
    enterState(state, "idle", randomIn(IDLE_DURATION_RANGE, rand));
  }
}
