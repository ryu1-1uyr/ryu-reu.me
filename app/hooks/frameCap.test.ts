import { describe, it, expect } from "vitest";
import { createFrameGate } from "./frameCap";

/** 60Hz の vsync で 1 秒回し、通ったフレーム数を数える */
function countPassed(cap: number | null, seconds = 1): number {
  const gate = createFrameGate(() => cap);
  let passed = 0;
  for (let i = 0; i < 60 * seconds; i++) {
    if (gate(i * (1000 / 60))) passed++;
  }
  return passed;
}

describe("createFrameGate", () => {
  it("上限が無ければ毎フレーム通す", () => {
    expect(countPassed(null)).toBe(60);
  });

  it("30fps なら 1 フレームおきに通す", () => {
    expect(countPassed(30)).toBe(30);
  });

  it("24fps なら 60Hz でも平均 24 コマに揃う", () => {
    expect(countPassed(24, 5)).toBe(120);
  });

  it("長く止まったあとは今を起点にして、まとめて通さない", () => {
    let cap: number | null = 24;
    const gate = createFrameGate(() => cap);
    gate(0);
    expect(gate(5000)).toBe(true);
    expect(gate(5016)).toBe(false);
    cap = null;
    expect(gate(5017)).toBe(true);
  });
});
