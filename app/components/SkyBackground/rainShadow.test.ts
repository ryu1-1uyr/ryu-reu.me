import { describe, it, expect } from "vitest";
import { isShadowed, type ShadowRect } from "./rainShadow";

const WINDOW: ShadowRect = { x: 100, y: 200, width: 400 };

describe("isShadowed", () => {
  it("サーフェスの真下（上辺より下・x 範囲内）は影", () => {
    expect(isShadowed(300, 250, [WINDOW])).toBe(true);
    // 画面下端まで影が伸びる（窓の下で雨が再出現しない）
    expect(isShadowed(300, 9999, [WINDOW])).toBe(true);
  });

  it("上辺より上は影ではない", () => {
    expect(isShadowed(300, 150, [WINDOW])).toBe(false);
  });

  it("x 範囲の外は影ではない", () => {
    expect(isShadowed(50, 250, [WINDOW])).toBe(false);
    expect(isShadowed(550, 250, [WINDOW])).toBe(false);
  });

  it("影がなければ常に false", () => {
    expect(isShadowed(300, 250, [])).toBe(false);
  });
});
