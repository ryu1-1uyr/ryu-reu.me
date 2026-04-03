"use client";

import { useRef, useEffect } from "react";
import type { SkyPhase, WeatherCondition } from "@/types/weather";

type Props = {
  phase: SkyPhase;
  phaseProgress: number;
  weatherCondition: WeatherCondition;
};

// --- 色定義 ---
// 旧カラー（リアル空）
// const SKY_COLORS: Record<SkyPhase, [string, string, string]> = {
//   night: ["#0d1b2a", "#1b2838", "#232946"],
//   sunrise: ["#232946", "#e07c4f", "#f2c57c"],
//   day: ["#4a90d9", "#87CEEB", "#b8d4e3"],
//   sunset: ["#232946", "#c94c4c", "#eebbc3"],
// };

// サイトパレット寄りカラー（#232946, #b8c1ec, #eebbc3, #f2c57c ベース）
const SKY_COLORS: Record<SkyPhase, [string, string, string]> = {
  night: ["#0d1b2a", "#1a2240", "#232946"],
  sunrise: ["#232946", "#8a6b7a", "#eebbc3"],
  day: ["#4a90d9", "#87CEEB", "#b8c1ec"],
  sunset: ["#232946", "#a0637a", "#f2c57c"],
};

// フェーズ間の遷移用（前のフェーズ）
const PHASE_ORDER: SkyPhase[] = ["night", "sunrise", "day", "sunset"];

function lerpColor(a: string, b: string, t: number): string {
  const parse = (hex: string) => {
    const v = parseInt(hex.slice(1), 16);
    return [(v >> 16) & 255, (v >> 8) & 255, v & 255];
  };
  const [ar, ag, ab] = parse(a);
  const [br, bg, bb] = parse(b);
  const r = Math.round(ar + (br - ar) * t);
  const g = Math.round(ag + (bg - ag) * t);
  const bl = Math.round(ab + (bb - ab) * t);
  return `rgb(${r},${g},${bl})`;
}

// --- パーティクル型 ---
type Star = { x: number; y: number; radius: number; twinkleOffset: number };
type Raindrop = { x: number; y: number; speed: number; length: number };
type Snowflake = {
  x: number;
  y: number;
  radius: number;
  speed: number;
  drift: number;
  driftOffset: number;
};
type Cloud = {
  x: number;
  y: number;
  width: number;
  speed: number;
  opacity: number;
};

function createStars(count: number, w: number, h: number): Star[] {
  return Array.from({ length: count }, () => ({
    x: Math.random() * w,
    y: Math.random() * h * 0.7,
    radius: Math.random() * 1.5 + 0.5,
    twinkleOffset: Math.random() * Math.PI * 2,
  }));
}

function createRain(count: number, w: number, h: number): Raindrop[] {
  return Array.from({ length: count }, () => ({
    x: Math.random() * w,
    y: Math.random() * h,
    speed: Math.random() * 4 + 6,
    length: Math.random() * 15 + 10,
  }));
}

function createSnow(count: number, w: number, h: number): Snowflake[] {
  return Array.from({ length: count }, () => ({
    x: Math.random() * w,
    y: Math.random() * h,
    radius: Math.random() * 2 + 1,
    speed: Math.random() * 1.5 + 0.5,
    drift: Math.random() * 0.5 + 0.2,
    driftOffset: Math.random() * Math.PI * 2,
  }));
}

function createClouds(count: number, w: number, h: number): Cloud[] {
  return Array.from({ length: count }, () => ({
    x: Math.random() * w,
    y: Math.random() * h * 0.4 + h * 0.05,
    width: Math.random() * 200 + 100,
    speed: Math.random() * 0.3 + 0.1,
    opacity: Math.random() * 0.3 + 0.15,
  }));
}

// --- 描画関数 ---
function drawSkyGradient(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  phase: SkyPhase,
  progress: number
) {
  const phaseIdx = PHASE_ORDER.indexOf(phase);
  const prevPhase = PHASE_ORDER[(phaseIdx - 1 + 4) % 4];
  const currentColors = SKY_COLORS[phase];
  const prevColors = SKY_COLORS[prevPhase];

  // フェーズの最初の20%は前フェーズからブレンド
  const blendT = progress < 0.2 ? progress / 0.2 : 1;

  const grad = ctx.createLinearGradient(0, 0, 0, h);
  for (let i = 0; i < 3; i++) {
    const color = lerpColor(prevColors[i], currentColors[i], blendT);
    grad.addColorStop(i / 2, color);
  }
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);
}

function drawStars(
  ctx: CanvasRenderingContext2D,
  stars: Star[],
  time: number,
  phase: SkyPhase,
  progress: number
) {
  // 星は夜と朝焼け序盤・夕焼け終盤で見える
  let opacity = 0;
  if (phase === "night") opacity = 1;
  else if (phase === "sunrise") opacity = Math.max(0, 1 - progress * 3);
  else if (phase === "sunset") opacity = Math.max(0, (progress - 0.6) * 2.5);

  if (opacity <= 0) return;

  for (const star of stars) {
    const twinkle = 0.3 + 0.7 * Math.sin(time * 0.002 + star.twinkleOffset);
    ctx.beginPath();
    ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255, 255, 255, ${twinkle * opacity})`;
    ctx.fill();
  }
}

function drawSun(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  phase: SkyPhase,
  progress: number
) {
  if (phase === "night") return;

  let x: number, y: number, opacity: number;

  if (phase === "sunrise") {
    // 右から上がる
    x = w * 0.8;
    y = h * (0.9 - progress * 0.5);
    opacity = Math.min(1, progress * 2);
  } else if (phase === "day") {
    // アーチを描く
    const angle = Math.PI * (0.1 + progress * 0.8);
    x = w * (0.2 + progress * 0.6);
    y = h * (0.4 - Math.sin(angle) * 0.25);
    opacity = 1;
  } else {
    // 沈んでいく
    x = w * 0.2;
    y = h * (0.4 + progress * 0.5);
    opacity = Math.max(0, 1 - progress * 1.5);
  }

  if (opacity <= 0) return;

  ctx.save();
  ctx.globalAlpha = opacity;
  ctx.shadowColor = "#f2c57c";
  ctx.shadowBlur = 60;
  ctx.beginPath();
  ctx.arc(x, y, 30, 0, Math.PI * 2);
  ctx.fillStyle = "#f2c57c";
  ctx.fill();
  ctx.restore();
}

function drawMoon(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  phase: SkyPhase,
  progress: number
) {
  if (phase !== "night") return;

  // アーチを描く
  const angle = Math.PI * (0.1 + progress * 0.8);
  const x = w * (0.2 + progress * 0.6);
  const y = h * (0.3 - Math.sin(angle) * 0.15);

  ctx.save();
  ctx.shadowColor = "#b8c1ec";
  ctx.shadowBlur = 40;

  // 満月
  ctx.beginPath();
  ctx.arc(x, y, 25, 0, Math.PI * 2);
  ctx.fillStyle = "#b8c1ec";
  ctx.fill();

  // 三日月マスク
  ctx.globalCompositeOperation = "destination-out";
  ctx.beginPath();
  ctx.arc(x + 10, y - 5, 20, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalCompositeOperation = "source-over";
  ctx.restore();
}

function drawClouds(ctx: CanvasRenderingContext2D, clouds: Cloud[], w: number) {
  for (const cloud of clouds) {
    cloud.x += cloud.speed;
    if (cloud.x > w + cloud.width) cloud.x = -cloud.width;

    ctx.save();
    ctx.globalAlpha = cloud.opacity;
    ctx.fillStyle = "rgba(255, 255, 255, 0.8)";

    // 楕円を3つ重ねて雲っぽく
    for (const [dx, dy, rx, ry] of [
      [0, 0, cloud.width * 0.4, cloud.width * 0.2],
      [
        cloud.width * 0.25,
        -cloud.width * 0.08,
        cloud.width * 0.3,
        cloud.width * 0.18,
      ],
      [
        -cloud.width * 0.2,
        cloud.width * 0.02,
        cloud.width * 0.25,
        cloud.width * 0.15,
      ],
    ] as [number, number, number, number][]) {
      ctx.beginPath();
      ctx.ellipse(cloud.x + dx, cloud.y + dy, rx, ry, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}

function drawRain(
  ctx: CanvasRenderingContext2D,
  drops: Raindrop[],
  h: number,
  w: number
) {
  ctx.strokeStyle = "rgba(184, 193, 236, 0.4)";
  ctx.lineWidth = 1;
  for (const drop of drops) {
    drop.y += drop.speed;
    drop.x -= drop.speed * 0.3;
    if (drop.y > h) {
      drop.y = -drop.length;
      drop.x = Math.random() * w;
    }

    ctx.beginPath();
    ctx.moveTo(drop.x, drop.y);
    ctx.lineTo(drop.x + drop.length * 0.3, drop.y + drop.length);
    ctx.stroke();
  }
}

function drawSnow(
  ctx: CanvasRenderingContext2D,
  flakes: Snowflake[],
  h: number,
  w: number,
  time: number
) {
  ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
  for (const flake of flakes) {
    flake.y += flake.speed;
    flake.x += Math.sin(time * 0.001 + flake.driftOffset) * flake.drift;
    if (flake.y > h) {
      flake.y = -flake.radius;
      flake.x = Math.random() * w;
    }

    ctx.beginPath();
    ctx.arc(flake.x, flake.y, flake.radius, 0, Math.PI * 2);
    ctx.fill();
  }
}

// --- メインコンポーネント ---
export default function SkyCanvas({
  phase,
  phaseProgress,
  weatherCondition,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const starsRef = useRef<Star[]>([]);
  const rainRef = useRef<Raindrop[]>([]);
  const snowRef = useRef<Snowflake[]>([]);
  const cloudsRef = useRef<Cloud[]>([]);
  const initedRef = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // prefers-reduced-motion チェック
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    const isMobile = window.innerWidth < 768;
    const dpr = window.devicePixelRatio || 1;

    const resize = () => {
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx.scale(dpr, dpr);
    };
    resize();
    window.addEventListener("resize", resize);

    const w = () => window.innerWidth;
    const h = () => window.innerHeight;

    // パーティクル初期化（1回だけ）
    if (!initedRef.current) {
      starsRef.current = createStars(isMobile ? 60 : 150, w(), h());
      rainRef.current = createRain(isMobile ? 80 : 200, w(), h());
      snowRef.current = createSnow(isMobile ? 60 : 150, w(), h());
      cloudsRef.current = createClouds(isMobile ? 3 : 7, w(), h());
      initedRef.current = true;
    }

    let animId: number;
    const startTime = performance.now();

    const render = () => {
      const time = performance.now() - startTime;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const cw = w();
      const ch = h();

      // 1. 空グラデーション
      drawSkyGradient(ctx, cw, ch, phase, phaseProgress);

      if (reducedMotion) {
        // アニメーション無効時はグラデーションだけ
        return;
      }

      // 2. 星
      drawStars(ctx, starsRef.current, time, phase, phaseProgress);

      // 3. 太陽 or 月
      drawSun(ctx, cw, ch, phase, phaseProgress);
      drawMoon(ctx, cw, ch, phase, phaseProgress);

      // 4. 雲
      if (
        weatherCondition === "clouds" ||
        weatherCondition === "rain" ||
        weatherCondition === "drizzle" ||
        weatherCondition === "thunderstorm"
      ) {
        drawClouds(ctx, cloudsRef.current, cw);
      }

      // 5. 雨
      if (
        weatherCondition === "rain" ||
        weatherCondition === "drizzle" ||
        weatherCondition === "thunderstorm"
      ) {
        drawRain(ctx, rainRef.current, ch, cw);
      }

      // 6. 雪
      if (weatherCondition === "snow") {
        drawSnow(ctx, snowRef.current, ch, cw, time);
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, [phase, phaseProgress, weatherCondition]);

  return <canvas ref={canvasRef} className="block w-full h-full" />;
}
