import { describe, it, expect } from "vitest";
import {
  createResident,
  tick,
  hop,
  WALK_SPEED,
  EDGE_MARGIN,
  type Platform,
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
    ...overrides,
  };
}

/** deltaMs を刻んで totalMs ぶん tick を回す */
function run(
  state: ResidentState,
  totalMs: number,
  platforms: Platform[],
  rand: () => number = () => 0.5,
): void {
  const step = 16;
  for (let t = 0; t < totalMs; t += step) {
    tick(state, step, platforms, VIEWPORT, rand);
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
