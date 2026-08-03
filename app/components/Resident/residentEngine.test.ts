import { describe, it, expect } from "vitest";
import {
  createResident,
  tick,
  hop,
  grab,
  moveHeld,
  releaseHeld,
  findShelterSpot,
  findNeighborTarget,
  chooseTeleportTarget,
  THROW_MAX_SPEED,
  GREETING_JOY_HOPS,
  YAWN_DURATION,
  CALM_ENV,
  WALK_SPEED,
  EDGE_MARGIN,
  SHELTER_MIN_HEADROOM,
  TELEPORT_BOTTOM_TIME,
  TELEPORT_COOLDOWN,
  type Platform,
  type ResidentEnv,
  type ResidentState,
  type Viewport,
} from "./residentEngine";

const VIEWPORT: Viewport = { width: 1280, height: 720 };
const GROUND: Platform = { id: "__ground", x: 0, y: 720, width: 1280 };
const WINDOW_A: Platform = { id: "win-a", x: 100, y: 300, width: 400 };

function makeState(overrides: Partial<ResidentState>): ResidentState {
  return {
    x: 300,
    y: 300,
    vx: 0,
    vy: 0,
    facing: 1,
    name: "idle",
    stateTime: 0,
    stateDuration: 99999,
    platformId: "win-a",
    cooldowns: { startle: 0, teleport: 0 },
    headSnow: 0,
    bottomTime: 0,
    targetX: null,
    teleportTarget: null,
    pendingCower: false,
    pendingGreeting: null,
    greetingHops: 0,
    ...overrides,
  };
}

/** deltaMs を刻んで totalMs ぶん tick を回す */
function run(
  state: ResidentState,
  totalMs: number,
  platforms: Platform[],
  rand: () => number = () => 0.5,
  env: ResidentEnv = CALM_ENV,
): void {
  const step = 16;
  for (let t = 0; t < totalMs; t += step) {
    tick(state, step, platforms, VIEWPORT, rand, env);
  }
}

describe("residentEngine", () => {
  it("生成直後は落下し、真下の足場の上辺に着地する", () => {
    const state = createResident(VIEWPORT, () => 0.5);
    expect(state.name).toBe("fall");
    const platform: Platform = { id: "win-a", x: 0, y: 300, width: 1280 };
    run(state, 3000, [platform, GROUND]);
    expect(state.y).toBe(300);
    expect(state.platformId).toBe("win-a");
    expect(["land", "idle", "walk"]).toContain(state.name);
  });

  it("walk 中は facing 方向に WALK_SPEED で移動する", () => {
    const state = makeState({ name: "walk", facing: 1 });
    tick(state, 1000, [WINDOW_A, GROUND], VIEWPORT, () => 0.5);
    expect(state.x).toBeCloseTo(300 + WALK_SPEED);
  });

  it("足場の端で rand < EDGE_TURN_PROBABILITY なら引き返す", () => {
    const state = makeState({
      name: "walk",
      facing: 1,
      x: WINDOW_A.x + WINDOW_A.width - EDGE_MARGIN,
    });
    tick(state, 16, [WINDOW_A, GROUND], VIEWPORT, () => 0.1);
    expect(state.facing).toBe(-1);
    expect(state.name).toBe("walk");
  });

  it("足場の端で rand >= EDGE_TURN_PROBABILITY なら踏み外して落ちる", () => {
    const state = makeState({
      name: "walk",
      facing: 1,
      x: WINDOW_A.x + WINDOW_A.width - EDGE_MARGIN,
    });
    tick(state, 16, [WINDOW_A, GROUND], VIEWPORT, () => 0.9);
    expect(state.name).toBe("fall");
    // その後、下の地面に着地する
    run(state, 3000, [WINDOW_A, GROUND], () => 0.9);
    expect(state.platformId).toBe("__ground");
  });

  it("画面端では必ず引き返す（地面の外へ歩かない）", () => {
    const state = makeState({
      name: "walk",
      facing: -1,
      x: EDGE_MARGIN,
      y: 720,
      platformId: "__ground",
    });
    // rand が常に「踏み外す」側でも画面端なら引き返す
    tick(state, 16, [GROUND], VIEWPORT, () => 0.9);
    expect(state.facing).toBe(1);
    expect(state.name).toBe("walk");
  });

  it("乗っている足場が消えたら落下する", () => {
    const state = makeState({ name: "idle" });
    tick(state, 16, [GROUND], VIEWPORT, () => 0.5);
    expect(state.name).toBe("fall");
  });

  it("足場が動いたら乗ったまま追従する（ドラッグ追従）", () => {
    const state = makeState({ name: "idle" });
    const moved: Platform = { ...WINDOW_A, x: 600, y: 500 };
    tick(state, 16, [moved, GROUND], VIEWPORT, () => 0.5);
    expect(state.y).toBe(500);
    // x は新しい足場の範囲内にクランプされる
    expect(state.x).toBeGreaterThanOrEqual(600 + EDGE_MARGIN);
    expect(state.x).toBeLessThanOrEqual(600 + 400 - EDGE_MARGIN);
  });

  it("夜は idle 満了で眠り、朝になると目を覚ます", () => {
    const state = makeState({ name: "idle", stateDuration: 100 });
    const night: ResidentEnv = { ...CALM_ENV, isNight: true };
    run(state, 200, [WINDOW_A, GROUND], () => 0.5, night);
    expect(state.name).toBe("sleep");
    // 眠っている間は動かない
    const xBefore = state.x;
    run(state, 1000, [WINDOW_A, GROUND], () => 0.5, night);
    expect(state.x).toBe(xBefore);
    // 朝になると起きる
    run(state, 100, [WINDOW_A, GROUND], () => 0.5, CALM_ENV);
    expect(state.name).toBe("idle");
  });

  it("雷鳴イベントでビックリし、クールダウン中は再発しない", () => {
    const state = makeState({ name: "idle" });
    const clap: ResidentEnv = { ...CALM_ENV, lightning: 1, thunder: true };
    tick(state, 16, [WINDOW_A, GROUND], VIEWPORT, () => 0.5, clap);
    expect(state.name).toBe("startle");
    expect(state.vy).toBeLessThan(0);
    // 着地させてから再度の雷鳴 → クールダウン中なのでビックリしない
    run(state, 2000, [WINDOW_A, GROUND], () => 0.5, CALM_ENV);
    expect(state.platformId).toBe("win-a");
    tick(state, 16, [WINDOW_A, GROUND], VIEWPORT, () => 0.5, clap);
    expect(state.name).not.toBe("startle");
  });

  it("sleep 中でも雷鳴では飛び起きる", () => {
    const state = makeState({ name: "sleep" });
    const nightClap: ResidentEnv = {
      ...CALM_ENV,
      isNight: true,
      lightning: 1,
      thunder: true,
    };
    tick(state, 16, [WINDOW_A, GROUND], VIEWPORT, () => 0.5, nightClap);
    expect(state.name).toBe("startle");
  });

  it("強風時は接地中も押し流される（sleep 中は流されない）", () => {
    const windy: ResidentEnv = { ...CALM_ENV, wind: 1 };
    const state = makeState({ name: "idle", x: 300 });
    tick(state, 1000, [WINDOW_A, GROUND], VIEWPORT, () => 0.5, windy);
    expect(state.x).toBeCloseTo(320);
    const sleeping = makeState({ name: "sleep", x: 300 });
    tick(sleeping, 1000, [WINDOW_A, GROUND], VIEWPORT, () => 0.5, windy);
    expect(sleeping.x).toBe(300);
  });

  it("頭の雪は idle 中に積もり、歩き出すと落ちる", () => {
    const snowy: ResidentEnv = { ...CALM_ENV, snow: 1 };
    const state = makeState({ name: "idle", stateDuration: 2000 });
    tick(state, 1000, [WINDOW_A, GROUND], VIEWPORT, () => 0.5, snowy);
    expect(state.headSnow).toBeCloseTo(0.15);
    // idle 満了 → walk でリセット
    run(state, 1500, [WINDOW_A, GROUND], () => 0.5, snowy);
    expect(state.name).toBe("walk");
    expect(state.headSnow).toBe(0);
  });

  it("hop で跳ねて同じ足場に着地し直す", () => {
    const state = makeState({ name: "idle", x: 300 });
    hop(state);
    expect(state.name).toBe("fall");
    expect(state.vy).toBeLessThan(0);
    run(state, 3000, [WINDOW_A, GROUND]);
    expect(state.platformId).toBe("win-a");
    expect(state.y).toBe(300);
  });
});

// 地面の上に張り出した「窓」を屋根に見立てる（雨宿り用）
const ROOF: Platform = { id: "roof", x: 500, y: 400, width: 300, height: 200 };
// 屋根下区間: [506, 794]（GROUND の歩行範囲・ROOF 幅の両方に収まる）
const ROOF_SPOT = ROOF.x + EDGE_MARGIN;

describe("findShelterSpot", () => {
  it("頭上に十分な高さの窓があれば、その屋根下区間内の x を返す", () => {
    const state = makeState({ x: 300, y: 720, platformId: "__ground" });
    const spot = findShelterSpot([GROUND, ROOF], GROUND, state);
    expect(spot).toBe(ROOF_SPOT);
  });

  it("屋根になる足場がなければ null", () => {
    const state = makeState({ x: 300, y: 720, platformId: "__ground" });
    const spot = findShelterSpot([GROUND], GROUND, state);
    expect(spot).toBeNull();
  });

  it("頭上のクリアランスが SHELTER_MIN_HEADROOM 未満なら null", () => {
    const lowRoof: Platform = {
      ...ROOF,
      y: GROUND.y - SHELTER_MIN_HEADROOM + 10,
      height: 5,
    };
    const state = makeState({ x: 300, y: 720, platformId: "__ground" });
    const spot = findShelterSpot([GROUND, lowRoof], GROUND, state);
    expect(spot).toBeNull();
  });
});

describe("雨宿り", () => {
  it("rain がしきい値を超えると idle から shelterSeek になり、targetX へ向かって進み、到着で shelter になる", () => {
    const rainy: ResidentEnv = { ...CALM_ENV, rain: 1 };
    const state = makeState({ name: "idle", platformId: "__ground", x: 300, y: 720 });
    tick(state, 16, [GROUND, ROOF], VIEWPORT, () => 0.5, rainy);
    expect(state.name).toBe("shelterSeek");
    expect(state.targetX).toBe(ROOF_SPOT);
    expect(state.facing).toBe(1); // ROOF_SPOT(506) は現在地(300)より右

    run(state, 10000, [GROUND, ROOF], () => 0.5, rainy);
    expect(state.name).toBe("shelter");
    expect(Math.abs(state.x - ROOF_SPOT)).toBeLessThan(2);
  });

  it("shelter 中は rain=0.4 では退出せず、rain=0.2 になると idle に戻る", () => {
    const state = makeState({
      name: "shelter",
      platformId: "__ground",
      x: ROOF_SPOT,
      y: 720,
      targetX: ROOF_SPOT,
    });
    tick(state, 16, [GROUND, ROOF], VIEWPORT, () => 0.5, { ...CALM_ENV, rain: 0.4 });
    expect(state.name).toBe("shelter");

    tick(state, 16, [GROUND, ROOF], VIEWPORT, () => 0.5, { ...CALM_ENV, rain: 0.2 });
    expect(state.name).toBe("idle");
    expect(state.targetX).toBeNull();
  });

  it("屋根のない足場（非最下層）では、近い方の端へ向かって降りに行く", () => {
    const rainy: ResidentEnv = { ...CALM_ENV, rain: 1 };
    // WINDOW_A の左端寄りに立たせる → 左端から降りるはず
    const state = makeState({ name: "idle", platformId: "win-a", x: 150 });
    tick(state, 16, [WINDOW_A, GROUND], VIEWPORT, () => 0.5, rainy);
    expect(state.name).toBe("shelterDescend");
    expect(state.facing).toBe(-1);
  });

  it("最下層の足場に屋根がなければ、従来どおりその場で shelter になる", () => {
    const rainy: ResidentEnv = { ...CALM_ENV, rain: 1 };
    const state = makeState({ name: "idle", platformId: "__ground", x: 300, y: 720 });
    tick(state, 16, [GROUND], VIEWPORT, () => 0.5, rainy);
    expect(state.name).toBe("shelter");
    expect(state.targetX).toBeNull();
  });

  it("窓の上から降りて、雨の影（屋根の下）まで多段で移動して雨宿りする", () => {
    const rainy: ResidentEnv = { ...CALM_ENV, rain: 1 };
    // WINDOW_A(y=300) には屋根がない。地面には ROOF の影がある
    const state = makeState({ name: "idle", platformId: "win-a", x: 300 });
    run(state, 30000, [WINDOW_A, ROOF, GROUND], () => 0.5, rainy);
    expect(state.name).toBe("shelter");
    expect(state.platformId).toBe("__ground");
    // 屋根下区間 [506, 794] の中で縮こまっている（到着判定の ±2px を許容）
    expect(state.x).toBeGreaterThanOrEqual(ROOF.x + EDGE_MARGIN - 2);
    expect(state.x).toBeLessThanOrEqual(ROOF.x + ROOF.width - EDGE_MARGIN + 2);
  });

  it("降りている途中で雨が止んだら idle に戻る", () => {
    const state = makeState({ name: "shelterDescend", platformId: "win-a", x: 300 });
    tick(state, 16, [WINDOW_A, GROUND], VIEWPORT, () => 0.5, { ...CALM_ENV, rain: 0.2 });
    expect(state.name).toBe("idle");
  });

  it("CALM_ENV（rain=0）では雨宿りが発動しない", () => {
    const state = makeState({ name: "idle", platformId: "__ground", x: 300, y: 720 });
    tick(state, 16, [GROUND, ROOF], VIEWPORT, () => 0.5);
    expect(state.name).toBe("idle");
  });
});

describe("隣接ジャンプ", () => {
  const WINDOW_B: Platform = { id: "win-b", x: 560, y: 300, width: 300 };

  it("findNeighborTarget: gap 60px・同じ高さの足場へ跳ぶ初速を返す", () => {
    const state = makeState({
      name: "walk",
      facing: 1,
      x: WINDOW_A.x + WINDOW_A.width - EDGE_MARGIN,
    });
    const jump = findNeighborTarget([WINDOW_A, WINDOW_B, GROUND], WINDOW_A, state);
    expect(jump).not.toBeNull();
    expect(jump!.vx).toBeGreaterThan(0);
    expect(jump!.vy).toBeLessThan(0);
  });

  it("findNeighborTarget: gap が大きすぎる足場には跳ばない", () => {
    const far: Platform = { id: "far", x: 800, y: 300, width: 300 };
    const state = makeState({
      name: "walk",
      facing: 1,
      x: WINDOW_A.x + WINDOW_A.width - EDGE_MARGIN,
    });
    expect(findNeighborTarget([WINDOW_A, far, GROUND], WINDOW_A, state)).toBeNull();
  });

  it("端で確率を引いたら隣の足場に跳び移って着地する", () => {
    const state = makeState({
      name: "walk",
      facing: 1,
      x: WINDOW_A.x + WINDOW_A.width - EDGE_MARGIN,
      stateDuration: 99999,
    });
    // rand=0.4: ジャンプ判定 (< 0.5) が先に引かれて跳ぶ
    run(state, 2000, [WINDOW_A, WINDOW_B, GROUND], () => 0.4);
    expect(state.platformId).toBe("win-b");
    expect(state.y).toBe(300);
  });
});

describe("テレポート", () => {
  it("最下層に長居した idle 満了時、上の足場へテレポートする", () => {
    const state = makeState({
      name: "idle",
      platformId: "__ground",
      x: 300,
      y: 720,
      stateDuration: 100,
      bottomTime: TELEPORT_BOTTOM_TIME,
    });
    // rand=0.4: 行き先乱択 + 発動確率 (< 0.5) を通す
    run(state, 150, [WINDOW_A, GROUND], () => 0.4);
    expect(state.name).toBe("teleportOut");
    // out 演出 → 瞬間移動 → in 演出 → idle
    run(state, 600, [WINDOW_A, GROUND], () => 0.4);
    expect(state.platformId).toBe("win-a");
    expect(state.y).toBe(300);
    expect(state.name).toBe("teleportIn");
    run(state, 500, [WINDOW_A, GROUND], () => 0.4);
    expect(state.name).toBe("idle");
    expect(state.cooldowns.teleport).toBeGreaterThan(TELEPORT_COOLDOWN - 2000);
  });

  it("上に足場がなければ発動しない", () => {
    const state = makeState({
      name: "idle",
      platformId: "__ground",
      x: 300,
      y: 720,
      stateDuration: 100,
      bottomTime: TELEPORT_BOTTOM_TIME,
    });
    run(state, 200, [GROUND], () => 0.4);
    expect(state.name).toBe("walk");
  });

  it("クールダウン中は発動しない", () => {
    const state = makeState({
      name: "idle",
      platformId: "__ground",
      x: 300,
      y: 720,
      stateDuration: 100,
      bottomTime: TELEPORT_BOTTOM_TIME,
      cooldowns: { startle: 0, teleport: TELEPORT_COOLDOWN },
    });
    run(state, 200, [WINDOW_A, GROUND], () => 0.4);
    expect(state.name).toBe("walk");
  });

  it("chooseTeleportTarget は歩行範囲内の x を返す", () => {
    const state = makeState({ platformId: "__ground", x: 300, y: 720 });
    const target = chooseTeleportTarget([WINDOW_A, GROUND], state, () => 0.5);
    expect(target).not.toBeNull();
    expect(target!.platformId).toBe("win-a");
    expect(target!.x).toBeGreaterThanOrEqual(WINDOW_A.x + EDGE_MARGIN);
    expect(target!.x).toBeLessThanOrEqual(WINDOW_A.x + WINDOW_A.width - EDGE_MARGIN);
  });
});

describe("掴んで投げる", () => {
  it("grab で held になり、物理が止まり moveHeld だけで動く", () => {
    const state = makeState({ name: "idle" });
    grab(state);
    expect(state.name).toBe("held");
    tick(state, 1000, [WINDOW_A, GROUND], VIEWPORT, () => 0.5);
    expect(state.x).toBe(300);
    expect(state.y).toBe(300);
    moveHeld(state, 700, 200, VIEWPORT);
    expect(state.x).toBe(700);
    expect(state.y).toBe(200);
  });

  it("moveHeld はビューポート内にクランプされる", () => {
    const state = makeState({ name: "held", platformId: null });
    moveHeld(state, -100, 9999, VIEWPORT);
    expect(state.x).toBe(0);
    expect(state.y).toBe(VIEWPORT.height);
  });

  it("releaseHeld はクランプ済みの初速で投げ、やがて着地する", () => {
    const state = makeState({ name: "held", platformId: null, x: 300, y: 200 });
    releaseHeld(state, 5000, -5000);
    expect(state.name).toBe("fall");
    expect(state.vx).toBe(THROW_MAX_SPEED);
    expect(state.vy).toBe(-THROW_MAX_SPEED);
    expect(state.facing).toBe(1);
    run(state, 5000, [GROUND]);
    expect(state.platformId).toBe("__ground");
  });

  it("held 中は hop が無視される", () => {
    const state = makeState({ name: "held", platformId: null });
    hop(state);
    expect(state.name).toBe("held");
  });
});

describe("雷鳴と cower", () => {
  const storm: ResidentEnv = { ...CALM_ENV, rain: 1, lightning: 1 };
  const stormClap: ResidentEnv = { ...storm, thunder: true };

  it("ビックリ着地後は数秒縮こまってから通常に戻る", () => {
    const state = makeState({ name: "idle" });
    tick(state, 16, [WINDOW_A, GROUND], VIEWPORT, () => 0.5, stormClap);
    expect(state.name).toBe("startle");
    expect(state.pendingCower).toBe(true);
    // 着地 → land 完了 → cower
    run(state, 1500, [WINDOW_A, GROUND], () => 0.5, CALM_ENV);
    expect(state.name).toBe("cower");
    // cower 満了で idle に復帰
    run(state, 4000, [WINDOW_A, GROUND], () => 0.5, CALM_ENV);
    expect(state.name).toBe("idle");
  });

  it("雷天候の間は雷鳴がなくても常時の雨宿りに入らない", () => {
    const state = makeState({ name: "idle" });
    tick(state, 16, [WINDOW_A, GROUND], VIEWPORT, () => 0.5, storm);
    expect(state.name).toBe("idle");
  });

  it("雨宿り中に雷天候へ変わったら解除される", () => {
    const state = makeState({ name: "shelter" });
    tick(state, 16, [WINDOW_A, GROUND], VIEWPORT, () => 0.5, storm);
    expect(state.name).toBe("idle");
  });
});

describe("訪問の挨拶", () => {
  it("joy: 最初の着地後に喜びジャンプを連発してから通常に戻る", () => {
    const state = makeState({
      name: "land",
      stateTime: 300,
      stateDuration: 280,
      pendingGreeting: "joy",
    });
    tick(state, 16, [WINDOW_A, GROUND], VIEWPORT, () => 0.5);
    // 1 回目のジャンプが始まり、残り回数が減っている
    expect(state.name).toBe("fall");
    expect(state.vy).toBeLessThan(0);
    expect(state.pendingGreeting).toBeNull();
    expect(state.greetingHops).toBe(GREETING_JOY_HOPS - 1);
    // 連発が終わると通常の徘徊に戻る
    run(state, 6000, [WINDOW_A, GROUND]);
    expect(state.greetingHops).toBe(0);
    expect(["idle", "walk"]).toContain(state.name);
  });

  it("sleepy: 着地後にあくびをして、夜ならそのまま眠る", () => {
    const state = makeState({
      name: "land",
      stateTime: 300,
      stateDuration: 280,
      pendingGreeting: "sleepy",
    });
    const night: ResidentEnv = { ...CALM_ENV, isNight: true };
    tick(state, 16, [WINDOW_A, GROUND], VIEWPORT, () => 0.5, night);
    expect(state.name).toBe("yawn");
    run(state, YAWN_DURATION + 100, [WINDOW_A, GROUND], () => 0.5, night);
    expect(state.name).toBe("sleep");
  });

  it("sleepy: 昼にあくびが終わったら idle に戻る", () => {
    const state = makeState({ name: "yawn", stateDuration: YAWN_DURATION });
    run(state, YAWN_DURATION + 100, [WINDOW_A, GROUND]);
    expect(state.name).toBe("idle");
  });

  it("掴まれたら未消費の挨拶はキャンセルされる", () => {
    const state = makeState({ pendingGreeting: "joy", greetingHops: 2 });
    grab(state);
    expect(state.pendingGreeting).toBeNull();
    expect(state.greetingHops).toBe(0);
  });
});
