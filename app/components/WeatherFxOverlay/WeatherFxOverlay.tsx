"use client";

import { useRef, useEffect, useCallback } from "react";
import { useSurfaceRegistry } from "@/app/contexts/SurfaceRegistry";
import { useWeatherFxBus } from "@/app/contexts/WeatherFxBus";
import { useWeatherData } from "@/app/hooks/useWeatherData";
import { useWeatherOverride } from "@/app/contexts/WeatherOverride";
import {
  createWeatherEngine,
  setCondition,
  tick,
  getEffectiveWind,
  type WeatherEngineState,
} from "@/app/components/SkyBackground/weatherEngine";
import { attachGustTracker } from "@/app/components/SkyBackground/gustTracker";
import {
  createRainFx,
  tickRainFx,
  drawRainFx,
  type RainFxState,
  type SurfaceRect,
} from "./rainFx";
import {
  createSnowFx,
  tickSnowFx,
  drawSnowFx,
  type SnowFxState,
  type NamedSurface,
} from "./snowFx";

export default function WeatherFxOverlay() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const registry = useSurfaceRegistry();
  const bus = useWeatherFxBus();
  const { weatherData, isLoading } = useWeatherData();
  const { override } = useWeatherOverride();

  const weatherCondition =
    override ?? (!isLoading && weatherData ? weatherData.condition : "clear");

  // bus があれば共有エンジンを使い、なければローカルにフォールバック
  // （ref はレンダー中に触れないため、解決は effect 内から呼ぶ）
  const localEngineRef = useRef<WeatherEngineState | null>(null);
  const resolveEngine = useCallback((): WeatherEngineState => {
    if (bus) return bus.getEngine();
    if (localEngineRef.current === null) {
      localEngineRef.current = createWeatherEngine();
    }
    return localEngineRef.current;
  }, [bus]);

  useEffect(() => {
    setCondition(resolveEngine(), weatherCondition);
  }, [weatherCondition, resolveEngine]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !registry) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const engine = resolveEngine();
    const rainFx: RainFxState = createRainFx();
    const snowFx: SnowFxState = createSnowFx();
    bus?.setSnowFx(snowFx);

    let rafId = 0;
    let lastTime = 0;

    function resize() {
      const dpr = Math.min(window.devicePixelRatio, 2);
      canvas!.width = window.innerWidth * dpr;
      canvas!.height = window.innerHeight * dpr;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    window.addEventListener("resize", resize);

    function loop(time: number) {
      rafId = requestAnimationFrame(loop);
      // タブ非表示から復帰した直後に巨大な delta が流れないようクランプ
      const delta = Math.min(lastTime ? time - lastTime : 16.67, 100);
      lastTime = time;

      // 共有エンジンの tick はこのループが唯一の所有者（WeatherFxBus 参照）
      tick(engine, delta);
      const { rain, snow } = engine.current;
      const wind = getEffectiveWind(engine);

      const w = window.innerWidth;
      const h = window.innerHeight;
      ctx!.clearRect(0, 0, w, h);

      const hasSnowAccum = snowFx.accumulations.size > 0 &&
        [...snowFx.accumulations.values()].some((a) =>
          a.columns.some((c) => c > 0),
        );

      if (rain <= 0 && snow <= 0 && !hasSnowAccum && snowFx.collapseParticles.length === 0) return;

      const surfaces = registry!.getSurfaces();
      const surfaceRects: SurfaceRect[] = [];
      const namedSurfaces: NamedSurface[] = [];
      surfaces.forEach((el, id) => {
        const r = el.getBoundingClientRect();
        const rect = { x: r.x, y: r.y, width: r.width, height: r.height };
        surfaceRects.push(rect);
        const zRaw = Number.parseInt(getComputedStyle(el).zIndex, 10);
        namedSurfaces.push({ id, rect, z: Number.isNaN(zRaw) ? 0 : zRaw });
      });

      if (rain > 0) {
        tickRainFx(rainFx, delta, rain, wind, w, h, surfaceRects);
        drawRainFx(rainFx, ctx!, rain, wind);
      }

      tickSnowFx(snowFx, delta, snow, wind, w, h, namedSurfaces);
      drawSnowFx(snowFx, ctx!, snow, namedSurfaces);
    }

    rafId = requestAnimationFrame(loop);
    const detachGust = attachGustTracker(engine);

    return () => {
      cancelAnimationFrame(rafId);
      detachGust();
      window.removeEventListener("resize", resize);
      bus?.setSnowFx(null);
    };
  }, [registry, resolveEngine, bus]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full z-[60] pointer-events-none"
      aria-hidden="true"
    />
  );
}
