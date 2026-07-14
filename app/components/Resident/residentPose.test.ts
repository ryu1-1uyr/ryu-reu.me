import { describe, it, expect } from "vitest";
import { CALM_ENV, type ResidentState } from "./residentEngine";
import { computePose, TILT_WIND_THRESHOLD } from "./residentPose";

function makeState(overrides: Partial<ResidentState>): ResidentState {
  return {
    x: 300,
    y: 300,
    vx: 0,
    vy: 0,
    facing: 1,
    name: "idle",
    stateTime: 0,
    stateDuration: 1000,
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

describe("computePose", () => {
  it("walk 中は bobY が周期的に振れ、frame が進む", () => {
    const p0 = computePose(makeState({ name: "walk", stateTime: 0 }), CALM_ENV, 500);
    // sin(π/2 * 90) 相当の山: stateTime = 90 * π/2 ≒ 141ms
    const pTop = computePose(makeState({ name: "walk", stateTime: 141 }), CALM_ENV, 500);
    expect(p0.bobY).toBeCloseTo(0);
    expect(pTop.bobY).toBeLessThan(-1);
    expect(computePose(makeState({ name: "walk", stateTime: 130 }), CALM_ENV, 500).frame).toBe(1);
  });

  it("land はスカッシュから復帰する（進行 0 → squashY 0.72、満了 → 1）", () => {
    const start = computePose(
      makeState({ name: "land", stateTime: 0, stateDuration: 280 }),
      CALM_ENV,
      500,
    );
    const end = computePose(
      makeState({ name: "land", stateTime: 280, stateDuration: 280 }),
      CALM_ENV,
      500,
    );
    expect(start.squashY).toBeCloseTo(0.72);
    expect(end.squashY).toBeCloseTo(1);
  });

  it("fall は縦に伸びる", () => {
    expect(computePose(makeState({ name: "fall" }), CALM_ENV, 500).squashY).toBeCloseTo(1.12);
  });

  it("実効風が閾値以上のときだけ tilt が付く", () => {
    const calm = computePose(makeState({}), { ...CALM_ENV, wind: TILT_WIND_THRESHOLD - 0.1 }, 500);
    const windy = computePose(makeState({}), { ...CALM_ENV, wind: 1.0 }, 500);
    const windyNeg = computePose(makeState({}), { ...CALM_ENV, wind: -1.0 }, 500);
    expect(calm.tilt).toBe(0);
    expect(windy.tilt).toBeCloseTo(8);
    expect(windyNeg.tilt).toBeCloseTo(-8);
  });

  it("sleep は目を閉じて zzz、startle は surprise を出す", () => {
    const sleeping = computePose(makeState({ name: "sleep" }), CALM_ENV, 500);
    expect(sleeping.emote).toBe("zzz");
    expect(sleeping.eyesClosed).toBe(true);
    const startled = computePose(makeState({ name: "startle" }), CALM_ENV, 500);
    expect(startled.emote).toBe("surprise");
    expect(startled.squashY).toBeCloseTo(1.12);
  });

  it("headSnow は state の値をそのまま反映する", () => {
    expect(computePose(makeState({ headSnow: 0.7 }), CALM_ENV, 500).headSnow).toBe(0.7);
  });

  it("まばたき: 周期 3400ms の先頭 120ms だけ目を閉じる", () => {
    expect(computePose(makeState({}), CALM_ENV, 3400 + 60).eyesClosed).toBe(true);
    expect(computePose(makeState({}), CALM_ENV, 3400 + 200).eyesClosed).toBe(false);
  });
});

describe("computePose 追加状態", () => {
  it("cower はしゃがみポーズ", () => {
    expect(computePose(makeState({ name: "cower" }), CALM_ENV, 500).crouch).toBe(true);
  });

  it("held はぶら下がりで縦に伸びる", () => {
    expect(computePose(makeState({ name: "held" }), CALM_ENV, 500).squashY).toBeCloseTo(1.12);
  });

  it("yawn は中間で最も伸び、後半は目を閉じる", () => {
    const mid = computePose(
      makeState({ name: "yawn", stateTime: 900, stateDuration: 1800 }),
      CALM_ENV,
      500,
    );
    expect(mid.squashY).toBeCloseTo(1.12);
    expect(mid.emote).toBe("yawn");
    const late = computePose(
      makeState({ name: "yawn", stateTime: 1400, stateDuration: 1800 }),
      CALM_ENV,
      500,
    );
    expect(late.eyesClosed).toBe(true);
  });

  it("喜びジャンプ中は joy を出す", () => {
    const pose = computePose(
      makeState({ name: "fall", greetingHops: 2 }),
      CALM_ENV,
      500,
    );
    expect(pose.emote).toBe("joy");
  });
});
