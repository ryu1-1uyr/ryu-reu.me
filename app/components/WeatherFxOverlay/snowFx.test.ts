import { describe, it, expect } from "vitest";
import {
  createSnowFx,
  tickSnowFx,
  type SnowFxState,
  type NamedSurface,
} from "./snowFx";

const TICK = 16.67;
const VIEW_W = 800;
const VIEW_H = 600;

function surface(
  id: string,
  x: number,
  y: number,
  width: number,
  z = 1,
  height = 100,
): NamedSurface {
  return { id, rect: { x, y, width, height }, z };
}

/** intensity 0 で tick する（スポーンと融解以外の挙動をテストしたいとき用） */
function tickAt(s: SnowFxState, surfaces: NamedSurface[], times = 1) {
  for (let i = 0; i < times; i++) {
    tickSnowFx(s, TICK, 0, 0, VIEW_W, VIEW_H, surfaces);
  }
}

function dropFlake(s: SnowFxState, x: number, y: number) {
  s.flakes.push({
    x,
    y,
    speed: 60,
    wobblePhase: 0,
    wobbleAmp: 0,
    size: 3,
    opacity: 1,
  });
}

describe("snowFx", () => {
  it("accumulates snow when a flake reaches an exposed top edge", () => {
    const s = createSnowFx();
    const surf = surface("a", 0, 100, 100);
    dropFlake(s, 50, 99);
    tickAt(s, [surf]);

    const acc = s.accumulations.get("a")!;
    expect(Math.max(...acc.columns)).toBeGreaterThan(0);
    expect(s.flakes.length).toBe(0);
  });

  it("does not accumulate on edges covered by a higher-z surface", () => {
    const s = createSnowFx();
    const back = surface("back", 0, 100, 100, 1);
    // back の上辺 (y=100) を完全に覆う手前のサーフェス
    const front = surface("front", -10, 50, 200, 2, 100);
    dropFlake(s, 50, 99);
    tickAt(s, [back, front]);

    const acc = s.accumulations.get("back")!;
    expect(Math.max(...acc.columns)).toBe(0);
    // フレークは着地せず落下し続ける
    expect(s.flakes.length).toBe(1);
  });

  it("does not accumulate on rounded corners (corner inset)", () => {
    const s = createSnowFx();
    const surf = surface("a", 0, 100, 100);
    dropFlake(s, 2, 99); // 左端の角丸ゾーン
    tickAt(s, [surf]);

    const acc = s.accumulations.get("a")!;
    expect(Math.max(...acc.columns)).toBe(0);
    expect(s.flakes.length).toBe(1);
  });

  it("collapses snow on a fast drag", () => {
    const s = createSnowFx();
    tickAt(s, [surface("a", 0, 100, 100)]);
    const acc = s.accumulations.get("a")!;
    acc.columns.fill(6);

    tickAt(s, [surface("a", 20, 100, 100)]); // 1フレームで20px移動

    expect(s.collapseParticles.length).toBeGreaterThan(0);
    expect(Math.max(...acc.columns)).toBe(0);
  });

  it("collapses snow on a slow drag via accumulated drift", () => {
    const s = createSnowFx();
    tickAt(s, [surface("a", 0, 100, 100)]);
    const acc = s.accumulations.get("a")!;
    acc.columns.fill(6);

    // 3px/frame のゆっくりドラッグ。単発では閾値未満でも累積で崩落する
    for (let i = 1; i <= 5; i++) {
      tickAt(s, [surface("a", i * 3, 100, 100)]);
    }

    expect(s.collapseParticles.length).toBeGreaterThan(0);
    expect(Math.max(...acc.columns)).toBe(0);
  });

  it("dumps snow and removes accumulation when a surface disappears", () => {
    const s = createSnowFx();
    tickAt(s, [surface("a", 0, 100, 100)]);
    s.accumulations.get("a")!.columns.fill(6);

    tickAt(s, []); // ウィンドウが閉じた

    expect(s.accumulations.size).toBe(0);
    expect(s.collapseParticles.length).toBeGreaterThan(0);
  });

  it("melts residual snow down to exactly zero", () => {
    const s = createSnowFx();
    const surf = surface("a", 0, 100, 100);
    tickAt(s, [surf]);
    const acc = s.accumulations.get("a")!;
    acc.columns.fill(0.5);

    tickAt(s, [surf], 30); // intensity 0 → 融解が進む

    expect(Math.max(...acc.columns)).toBe(0);
  });
});
