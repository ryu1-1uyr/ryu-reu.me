/**
 * デスクトップの住人（マスコット）の行動エンジン。
 * DOM に依存しない純粋 TS。足場矩形の配列・経過時間・環境入力（天候/時間帯）から
 * 状態を進める。座標はすべて「足元中心」基準（描画側でスプライトの原点に変換する）。
 */

export type Platform = {
  id: string;
  /** 上辺の y 座標（足がここに乗る） */
  y: number;
  x: number;
  width: number;
  /** 矩形の高さ。雨宿りの屋根判定に使う。省略時 0（地面など屋根になれない足場） */
  height?: number;
};

export type ResidentStateName =
  | "idle"
  | "walk"
  | "fall"
  | "land"
  | "sleep"
  | "startle"
  | "shelterSeek"
  | "shelter"
  | "teleportOut"
  | "teleportIn"
  | "cower"
  | "held";

export type ResidentState = {
  x: number;
  y: number;
  /** fall / startle 中の速度。それ以外の状態では使わない */
  vx: number;
  vy: number;
  facing: 1 | -1;
  name: ResidentStateName;
  /** 現在の状態の経過時間 (ms) */
  stateTime: number;
  /** idle / walk / land / startle の継続予定時間 (ms) */
  stateDuration: number;
  /** 乗っている足場の id（fall / startle 中は null） */
  platformId: string | null;
  /** 行動クールダウンの残り (ms) */
  cooldowns: { startle: number; teleport: number };
  /** 頭の積雪量 0-1。idle/sleep 中に積もり、動くと落ちる */
  headSnow: number;
  /** 最下層足場での滞在累計 (ms)。テレポート発動条件 */
  bottomTime: number;
  /** shelterSeek の目的地 x（雨宿り用） */
  targetX: number | null;
  /** テレポートの行き先（teleportOut 中に保持） */
  teleportTarget: { platformId: string; x: number } | null;
  /** 雷ビックリの着地後に縮こまる予約フラグ */
  pendingCower: boolean;
};

export type Viewport = { width: number; height: number };

/**
 * 天候・時間帯の環境入力。WeatherEngine の補間済みチャンネル値を毎 tick 渡す。
 * wind は getEffectiveWind() の実効値（突風込み、±1.5 符号付き）。
 */
export type ResidentEnv = {
  rain: number;
  snow: number;
  wind: number;
  lightning: number;
  isNight: boolean;
  /** この tick で雷鳴（稲妻の一撃）が発生したか。thunderBus のイベントを転写する */
  thunder: boolean;
};

/** 環境入力なし（晴天・昼）の既定値。既存テストの後方互換用 */
export const CALM_ENV: ResidentEnv = {
  rain: 0,
  snow: 0,
  wind: 0,
  lightning: 0,
  isNight: false,
  thunder: false,
};

export const WALK_SPEED = 36; // px/s
export const GRAVITY = 1800; // px/s^2
export const MAX_FALL_SPEED = 800; // px/s
export const LAND_DURATION = 280; // ms
export const EDGE_MARGIN = 6; // 足場端から足元中心までの最小距離
/** 足場の端に着いたとき引き返す確率（残りは踏み外して落ちる） */
export const EDGE_TURN_PROBABILITY = 0.6;

export const STARTLE_DURATION = 600; // ms（ビックリポーズの上限。着地で打ち切り）
export const STARTLE_COOLDOWN = 8000; // ms
const STARTLE_HOP_VY = -300;
/** lightning チャンネルがこの値以上の間は雷天候とみなす（雨宿りの抑止に使う） */
export const LIGHTNING_ACTIVE_THRESHOLD = 0.5;
/** ビックリ着地後に縮こまる時間 (ms) */
export const COWER_DURATION_RANGE: [number, number] = [2000, 4000];
/** ドラッグで投げた時の初速クランプ (px/s) */
export const THROW_MAX_SPEED = 700;
/** この実効風以上で接地中も押し流される */
export const WIND_PUSH_THRESHOLD = 0.8;
const WIND_PUSH_SPEED = 20; // px/s（wind=1 のとき）
const HEAD_SNOW_RATE = 0.15; // 1/s（snow=1 のとき）
/** この高さ以下（画面下端基準）の足場を「最下層」とみなす。taskbar(h-10=40px) を含む */
const BOTTOM_ZONE_PX = 48;

/** 雨宿りに入る雨量のしきい値（ヒステリシス） */
export const SHELTER_ENTER_RAIN = 0.5;
/** 雨宿りから出る雨量のしきい値（ヒステリシス） */
export const SHELTER_EXIT_RAIN = 0.3;
/** 屋根とみなすための最低頭上クリアランス (px) */
export const SHELTER_MIN_HEADROOM = 30;
/** 屋根下区間として有効とみなす最小幅 (px) */
export const SHELTER_MIN_WIDTH = 20;

// --- 隣接ジャンプ ---
/** 跳び移れる足場の上辺高低差の上限 (px) */
export const NEIGHBOR_JUMP_MAX_DY = 60;
/** 跳び移れる水平ギャップの上限 (px) */
export const NEIGHBOR_JUMP_MAX_GAP = 90;
/** 足場の端で隣接足場に跳ぶ確率（引き返す/踏み外す判定より先に評価） */
export const NEIGHBOR_JUMP_PROBABILITY = 0.5;
const NEIGHBOR_JUMP_VY = -380;
const NEIGHBOR_JUMP_AIRTIME = 0.42; // s。vy=-380, GRAVITY=1800 でほぼ同高度に戻る滞空時間

// --- テレポート（下→上の動線） ---
/** 最下層足場にこれだけ滞在すると上へ帰りたくなる (ms) */
export const TELEPORT_BOTTOM_TIME = 12000;
export const TELEPORT_COOLDOWN = 30000; // ms
export const TELEPORT_OUT_DURATION = 500; // ms（縮んで消える）
export const TELEPORT_IN_DURATION = 400; // ms（現れる）
/** 行き先はいまより最低これだけ高い足場 (px) */
const TELEPORT_MIN_RISE = 80;
/** 条件が揃った idle 満了時に発動する確率（機械的すぎない揺らぎ） */
const TELEPORT_PROBABILITY = 0.5;

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
    cooldowns: { startle: 0, teleport: 0 },
    headSnow: 0,
    bottomTime: 0,
    targetX: null,
    teleportTarget: null,
    pendingCower: false,
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
  state.headSnow = 0;
  state.teleportTarget = null;
}

/** クリック等で小さく跳ねさせる。落下・掴まれ中は無視。sleep からは目を覚まして跳ねる */
export function hop(state: ResidentState): void {
  if (state.name === "fall" || state.name === "startle" || state.name === "held") return;
  enterFall(state, state.facing * 30, -420);
}

/** ポインタで掴む。以降 moveHeld で追従させ、releaseHeld で放す */
export function grab(state: ResidentState): void {
  enterState(state, "held", 0);
  state.platformId = null;
  state.vx = 0;
  state.vy = 0;
  state.headSnow = 0;
  state.teleportTarget = null;
  state.pendingCower = false;
}

/** 掴まれ中の足元位置をポインタに追従させる */
export function moveHeld(
  state: ResidentState,
  x: number,
  y: number,
  viewport: Viewport,
): void {
  if (state.name !== "held") return;
  state.x = Math.max(0, Math.min(viewport.width, x));
  state.y = Math.max(-40, Math.min(viewport.height, y));
}

/** 掴みを放す。ポインタの速度を初速として投げられる */
export function releaseHeld(state: ResidentState, vx: number, vy: number): void {
  if (state.name !== "held") return;
  const cvx = Math.max(-THROW_MAX_SPEED, Math.min(THROW_MAX_SPEED, vx));
  const cvy = Math.max(-THROW_MAX_SPEED, Math.min(THROW_MAX_SPEED, vy));
  enterFall(state, cvx, cvy);
  if (Math.abs(cvx) > 1) state.facing = cvx > 0 ? 1 : -1;
}

function walkRange(p: Platform): [number, number] {
  const min = p.x + EDGE_MARGIN;
  const max = p.x + p.width - EDGE_MARGIN;
  // 足場が極端に狭い場合は中央に立たせる
  return min <= max ? [min, max] : [p.x + p.width / 2, p.x + p.width / 2];
}

/**
 * 現在の足場 standing の上を歩いて到達できる「屋根の下」の x を返す。
 * 屋根候補: standing 以外の足場のうち height を持ち、下辺が standing の頭上より
 * SHELTER_MIN_HEADROOM 以上高い位置で終わるもの。その真下と standing の歩行範囲が
 * 重なる区間（幅 SHELTER_MIN_WIDTH 以上）を屋根下とみなし、state.x に最も近い区間の
 * 最も近い x（区間内にクランプ）を返す。見つからなければ null。
 */
export function findShelterSpot(
  platforms: Platform[],
  standing: Platform,
  state: ResidentState,
): number | null {
  const [standMin, standMax] = walkRange(standing);
  let bestX: number | null = null;
  let bestDist = Infinity;

  for (const r of platforms) {
    if (r.id === standing.id) continue;
    const height = r.height ?? 0;
    if (height <= 0) continue;
    if (r.y + height > standing.y - SHELTER_MIN_HEADROOM) continue;

    const min = Math.max(r.x + EDGE_MARGIN, standMin);
    const max = Math.min(r.x + r.width - EDGE_MARGIN, standMax);
    if (max - min < SHELTER_MIN_WIDTH) continue;

    const x = Math.max(min, Math.min(max, state.x));
    const dist = Math.abs(state.x - x);
    if (dist < bestDist) {
      bestDist = dist;
      bestX = x;
    }
  }

  return bestX;
}

/**
 * 進行方向にある跳び移り可能な隣接足場を探し、弾道ジャンプの初速を返す。
 * 条件: 上辺の高低差 <= NEIGHBOR_JUMP_MAX_DY、進行方向の水平ギャップが
 * [0, NEIGHBOR_JUMP_MAX_GAP]。複数あればギャップ最小のものを選ぶ。
 * 着地は既存の厳密判定に任せる（届かず落ちるのも愛嬌として許容）。
 */
export function findNeighborTarget(
  platforms: Platform[],
  standing: Platform,
  state: ResidentState,
): { vx: number; vy: number } | null {
  const edgeX = state.facing === 1 ? standing.x + standing.width : standing.x;
  let best: Platform | null = null;
  let bestGap = Infinity;

  for (const q of platforms) {
    if (q.id === standing.id) continue;
    if (Math.abs(q.y - standing.y) > NEIGHBOR_JUMP_MAX_DY) continue;
    const gap = state.facing === 1 ? q.x - edgeX : edgeX - (q.x + q.width);
    if (gap < 0 || gap > NEIGHBOR_JUMP_MAX_GAP) continue;
    if (gap < bestGap) {
      bestGap = gap;
      best = q;
    }
  }
  if (!best) return null;

  // 着地目標は相手足場の手前端の少し内側
  const targetX =
    state.facing === 1
      ? best.x + EDGE_MARGIN + 4
      : best.x + best.width - EDGE_MARGIN - 4;
  return {
    vx: (targetX - state.x) / NEIGHBOR_JUMP_AIRTIME,
    vy: NEIGHBOR_JUMP_VY,
  };
}

/**
 * テレポートの行き先を選ぶ。state.y より TELEPORT_MIN_RISE 以上高い足場から
 * 幅の重み付きで乱択し、歩行範囲内のランダムな x を返す。候補がなければ null。
 */
export function chooseTeleportTarget(
  platforms: Platform[],
  state: ResidentState,
  rand: Rand,
): { platformId: string; x: number } | null {
  const candidates = platforms.filter(
    (p) => p.y < state.y - TELEPORT_MIN_RISE && p.width > EDGE_MARGIN * 2,
  );
  if (candidates.length === 0) return null;

  const totalWidth = candidates.reduce((sum, p) => sum + p.width, 0);
  let pick = rand() * totalWidth;
  let chosen = candidates[candidates.length - 1];
  for (const p of candidates) {
    pick -= p.width;
    if (pick <= 0) {
      chosen = p;
      break;
    }
  }
  const [min, max] = walkRange(chosen);
  return { platformId: chosen.id, x: min + (max - min) * rand() };
}

/** fall / startle 共通の落下物理と着地判定 */
function applyFallPhysics(
  state: ResidentState,
  dt: number,
  platforms: Platform[],
  viewport: Viewport,
): void {
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
}

export function tick(
  state: ResidentState,
  deltaMs: number,
  platforms: Platform[],
  viewport: Viewport,
  rand: Rand = Math.random,
  env: ResidentEnv = CALM_ENV,
): void {
  const dt = deltaMs / 1000;
  state.stateTime += deltaMs;
  state.cooldowns.startle = Math.max(0, state.cooldowns.startle - deltaMs);
  state.cooldowns.teleport = Math.max(0, state.cooldowns.teleport - deltaMs);

  // 掴まれ中: 位置は moveHeld が外から与えるので物理は動かさない
  if (state.name === "held") return;

  if (state.name === "fall" || state.name === "startle") {
    applyFallPhysics(state, dt, platforms, viewport);
    return;
  }

  // --- 接地状態 (idle / walk / land / sleep) ---
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

  // 最下層足場での滞在時間（テレポート発動の前提条件）
  if (platform.y >= viewport.height - BOTTOM_ZONE_PX) {
    state.bottomTime += deltaMs;
  } else {
    state.bottomTime = 0;
  }

  // テレポート演出中は他のあらゆる割り込みを受けない
  if (state.name === "teleportOut") {
    if (state.stateTime >= state.stateDuration) {
      const dest = state.teleportTarget
        ? platforms.find((p) => p.id === state.teleportTarget!.platformId)
        : undefined;
      if (dest && state.teleportTarget) {
        const [min, max] = walkRange(dest);
        state.x = Math.max(min, Math.min(max, state.teleportTarget.x));
        state.y = dest.y;
        state.platformId = dest.id;
      }
      // 行き先が消えていた場合はその場に再出現する
      state.teleportTarget = null;
      state.cooldowns.teleport = TELEPORT_COOLDOWN;
      enterState(state, "teleportIn", TELEPORT_IN_DURATION);
    }
    return;
  }
  if (state.name === "teleportIn") {
    if (state.stateTime >= state.stateDuration) {
      enterState(state, "idle", randomIn(IDLE_DURATION_RANGE, rand));
    }
    return;
  }

  // 優先度①: 雷鳴に驚く（sleep からも飛び起きる）。
  // 雷鳴は SkyCanvas の稲妻発生と同期した thunderBus イベント（env.thunder）
  if (env.thunder && state.cooldowns.startle <= 0) {
    state.cooldowns.startle = STARTLE_COOLDOWN;
    enterState(state, "startle", STARTLE_DURATION);
    state.platformId = null;
    state.vx = 0;
    state.vy = STARTLE_HOP_VY;
    state.headSnow = 0;
    state.pendingCower = true;
    return;
  }

  // 優先度②: 雨宿り（sleep 中でも雨が強まれば起きて動き出す）。
  // 雷天候の間は常時縮こまりを避け、雷鳴ごとの startle → cower に任せる
  const inShelterFlow = state.name === "shelterSeek" || state.name === "shelter";
  if (
    !inShelterFlow &&
    env.rain >= SHELTER_ENTER_RAIN &&
    env.lightning < LIGHTNING_ACTIVE_THRESHOLD &&
    state.name !== "cower"
  ) {
    const spot = findShelterSpot(platforms, platform, state);
    if (spot !== null) {
      state.targetX = spot;
      enterState(state, "shelterSeek", 0);
    } else {
      state.targetX = null;
      enterState(state, "shelter", 0);
    }
    return;
  }
  if (
    inShelterFlow &&
    (env.rain <= SHELTER_EXIT_RAIN || env.lightning >= LIGHTNING_ACTIVE_THRESHOLD)
  ) {
    state.targetX = null;
    enterState(state, "idle", randomIn(IDLE_DURATION_RANGE, rand));
    return;
  }

  // 強風の押し流し（sleep 中は丸まっているので流されない）
  if (state.name !== "sleep" && Math.abs(env.wind) >= WIND_PUSH_THRESHOLD) {
    state.x = Math.max(minX, Math.min(maxX, state.x + env.wind * WIND_PUSH_SPEED * dt));
  }

  // 頭の雪: じっとしている間だけ積もる
  if (state.name === "idle" || state.name === "sleep") {
    state.headSnow = Math.min(1, state.headSnow + env.snow * HEAD_SNOW_RATE * dt);
  }

  if (state.name === "sleep") {
    if (!env.isNight) {
      enterState(state, "idle", randomIn(IDLE_DURATION_RANGE, rand));
    }
    return;
  }

  if (state.name === "shelterSeek") {
    if (state.targetX === null || Math.abs(state.targetX - state.x) < 2) {
      enterState(state, "shelter", 0);
      return;
    }
    state.facing = state.targetX > state.x ? 1 : -1;
    state.x += state.facing * WALK_SPEED * dt;
    return;
  }

  if (state.name === "shelter") {
    // 屋根の下で身を縮めてじっと待つ（強風の押し流しは上で適用済み）
    return;
  }

  if (state.name === "cower") {
    // 雷鳴に驚いた後、しばらく縮こまってから立ち直る
    if (state.stateTime >= state.stateDuration) {
      enterState(state, "idle", randomIn(IDLE_DURATION_RANGE, rand));
    }
    return;
  }

  if (state.name === "land") {
    if (state.stateTime >= state.stateDuration) {
      if (state.pendingCower) {
        state.pendingCower = false;
        enterState(state, "cower", randomIn(COWER_DURATION_RANGE, rand));
      } else {
        enterState(state, "idle", randomIn(IDLE_DURATION_RANGE, rand));
      }
    }
    return;
  }

  if (state.name === "idle") {
    if (state.stateTime >= state.stateDuration) {
      // 最下層に長居していたら、確率で上の足場へテレポートして帰る
      if (
        state.bottomTime >= TELEPORT_BOTTOM_TIME &&
        state.cooldowns.teleport <= 0
      ) {
        const target = chooseTeleportTarget(platforms, state, rand);
        if (target && rand() < TELEPORT_PROBABILITY) {
          state.teleportTarget = target;
          enterState(state, "teleportOut", TELEPORT_OUT_DURATION);
          return;
        }
      }
      // 夜は歩き出さずに眠る
      if (env.isNight) {
        enterState(state, "sleep", 0);
        return;
      }
      if (rand() < 0.3) state.facing = state.facing === 1 ? -1 : 1;
      enterState(state, "walk", randomIn(WALK_DURATION_RANGE, rand));
      state.headSnow = 0;
    }
    return;
  }

  // walk
  const nextX = state.x + state.facing * WALK_SPEED * dt;
  if (nextX < minX || nextX > maxX) {
    // 進行方向に跳び移れる足場があれば確率でジャンプ
    const jump = findNeighborTarget(platforms, platform, state);
    if (jump && rand() < NEIGHBOR_JUMP_PROBABILITY) {
      enterFall(state, jump.vx, jump.vy);
      return;
    }
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
