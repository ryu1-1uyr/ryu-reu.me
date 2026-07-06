import { describe, it, expect } from "vitest";
import {
  createWeatherEngine,
  setCondition,
  tick,
  getRecipe,
  addGust,
  getEffectiveWind,
  type WeatherChannels,
} from "./weatherEngine";

describe("weatherEngine", () => {
  it("initializes channels at recipe values", () => {
    const engine = createWeatherEngine("rain");
    const recipe = getRecipe("rain");
    expect(engine.current).toEqual(recipe);
    expect(engine.target).toEqual(recipe);
    expect(engine.transition).toBeNull();
  });

  it("sets target on condition change", () => {
    const engine = createWeatherEngine("clear");
    setCondition(engine, "rain");
    expect(engine.target).toEqual(getRecipe("rain"));
    expect(engine.condition).toBe("rain");
    expect(engine.prevCondition).toBe("clear");
    expect(engine.transition).toEqual({ from: "clear", to: "rain" });
    expect(engine.current.rain).toBe(0);
  });

  it("ignores same condition", () => {
    const engine = createWeatherEngine("clear");
    setCondition(engine, "clear");
    expect(engine.transition).toBeNull();
    expect(engine.prevCondition).toBeNull();
  });

  it("converges toward target over time", () => {
    const engine = createWeatherEngine("clear");
    setCondition(engine, "rain");
    for (let i = 0; i < 2400; i++) tick(engine, 16.67);
    const recipe = getRecipe("rain");
    for (const key of Object.keys(recipe) as (keyof WeatherChannels)[]) {
      expect(engine.current[key]).toBeCloseTo(recipe[key], 2);
    }
    expect(engine.transition).toBeNull();
  });

  it("shows partial progress after short time", () => {
    const engine = createWeatherEngine("clear");
    setCondition(engine, "snow");
    tick(engine, 1000);
    expect(engine.current.snow).toBeGreaterThan(0.25);
    expect(engine.current.snow).toBeLessThan(0.45);
    expect(engine.transition).not.toBeNull();
  });

  it("clears transition after settling", () => {
    const engine = createWeatherEngine("rain");
    setCondition(engine, "clear");
    expect(engine.transition).toEqual({ from: "rain", to: "clear" });
    for (let i = 0; i < 2400; i++) tick(engine, 16.67);
    expect(engine.transition).toBeNull();
  });

  it("handles rapid condition changes", () => {
    const engine = createWeatherEngine("clear");
    setCondition(engine, "rain");
    tick(engine, 500);
    setCondition(engine, "snow");
    expect(engine.transition).toEqual({ from: "rain", to: "snow" });
    expect(engine.current.rain).toBeGreaterThan(0);
    for (let i = 0; i < 2400; i++) tick(engine, 16.67);
    expect(engine.current.rain).toBeCloseTo(0, 2);
    expect(engine.current.snow).toBeCloseTo(1, 2);
  });

  it("handles zero deltaMs", () => {
    const engine = createWeatherEngine("clear");
    setCondition(engine, "rain");
    const before = { ...engine.current };
    tick(engine, 0);
    expect(engine.current).toEqual(before);
  });

  it("respects different time constants per channel", () => {
    const engine = createWeatherEngine("clear");
    setCondition(engine, "thunderstorm");
    tick(engine, 2000);
    // wind (tau=1500ms) should converge faster than cloudCover (tau=6000ms)
    const windProgress = engine.current.wind / getRecipe("thunderstorm").wind;
    const cloudProgress =
      engine.current.cloudCover / getRecipe("thunderstorm").cloudCover;
    expect(windProgress).toBeGreaterThan(cloudProgress);
  });

  it("accumulates gust impulses and clamps at the max", () => {
    const engine = createWeatherEngine("clear");
    addGust(engine, 0.5);
    expect(engine.gust).toBeCloseTo(0.5);
    for (let i = 0; i < 10; i++) addGust(engine, 0.5);
    expect(engine.gust).toBe(1.5);
    for (let i = 0; i < 30; i++) addGust(engine, -0.5);
    expect(engine.gust).toBe(-1.5);
  });

  it("decays gust toward exactly zero on tick", () => {
    const engine = createWeatherEngine("clear");
    addGust(engine, 1);
    tick(engine, 1200); // 1 tau で約 1/e に減衰
    expect(engine.gust).toBeGreaterThan(0.3);
    expect(engine.gust).toBeLessThan(0.45);
    for (let i = 0; i < 600; i++) tick(engine, 16.67);
    expect(engine.gust).toBe(0);
  });

  it("combines wind channel and gust into effective wind", () => {
    const engine = createWeatherEngine("thunderstorm"); // wind: 0.7
    expect(getEffectiveWind(engine)).toBeCloseTo(0.7);
    addGust(engine, 0.4);
    expect(getEffectiveWind(engine)).toBeCloseTo(1.1);
    addGust(engine, 10); // 過剰なインパルスでも上限で頭打ち
    expect(getEffectiveWind(engine)).toBe(1.5);
    const calm = createWeatherEngine("clear");
    addGust(calm, -0.8);
    expect(getEffectiveWind(calm)).toBeCloseTo(-0.8); // 負の風（左向き）も許容
  });
});
