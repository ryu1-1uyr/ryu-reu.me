import { describe, it, expect } from "vitest";
import { createRainGlass, tickRainGlass, type GlassDrop } from "./rainGlass";

const W = 1000;
const H = 800;

function drop(partial: Partial<GlassDrop>): GlassDrop {
  return { x: 100, y: 100, r: 8, vy: 0, stall: 0, trailTop: 100, ...partial };
}

describe("tickRainGlass", () => {
  it("雨が無ければ粒は増えない", () => {
    const s = createRainGlass();
    for (let i = 0; i < 100; i++) tickRainGlass(s, 100, 0, 2, W, H, 24);
    expect(s.drops).toHaveLength(0);
  });

  it("雨の強さに応じて発生し、上限を超えない", () => {
    // 同じ位置に湧いて合体しないよう、値をずらしながら返す
    let n = 0;
    const rand = () => (n++ * 0.37) % 1;
    const s = createRainGlass();
    tickRainGlass(s, 1000, 1, 3, W, H, 24, rand);
    expect(s.drops).toHaveLength(3);
    for (let i = 0; i < 50; i++) tickRainGlass(s, 1000, 1, 3, W, H, 5, rand);
    expect(s.drops.length).toBeLessThanOrEqual(5);
  });

  it("止まっている粒は動かない", () => {
    const s = createRainGlass();
    s.drops.push(drop({ stall: 500 }));
    tickRainGlass(s, 100, 0, 0, W, H, 24, () => 0.99);
    expect(s.drops[0].y).toBe(100);
    expect(s.drops[0].stall).toBe(400);
  });

  it("滑っている粒は下に進み、画面下に抜けたら消える", () => {
    const s = createRainGlass();
    s.drops.push(drop({ y: 100 }));
    tickRainGlass(s, 100, 0, 0, W, H, 24, () => 0.99);
    expect(s.drops[0].y).toBeGreaterThan(100);

    s.drops[0].y = H + 50;
    tickRainGlass(s, 16, 0, 0, W, H, 24, () => 0.99);
    expect(s.drops).toHaveLength(0);
  });

  it("重なった粒は下側に合体し、面積を保存する", () => {
    const s = createRainGlass();
    s.drops.push(drop({ x: 100, y: 100, r: 6, stall: 1000, trailTop: 40 }));
    s.drops.push(drop({ x: 102, y: 106, r: 8, stall: 1000, trailTop: 90 }));
    tickRainGlass(s, 1, 0, 0, W, H, 24, () => 0.99);
    expect(s.drops).toHaveLength(1);
    expect(s.drops[0].y).toBe(106);
    expect(s.drops[0].r).toBeCloseTo(10);
    expect(s.drops[0].trailTop).toBe(40);
  });

  it("筋は一定の長さより伸びない", () => {
    const s = createRainGlass();
    s.drops.push(drop({ y: 700, trailTop: 0 }));
    tickRainGlass(s, 16, 0, 0, W, H, 24, () => 0.99);
    expect(s.drops[0].y - s.drops[0].trailTop).toBeLessThanOrEqual(H * 0.45 + 1e-6);
  });
});
