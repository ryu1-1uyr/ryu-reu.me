"use client";

import { useRef, useEffect } from "react";
import type { SkyPhase, WeatherCondition } from "@/types/weather";

type Props = {
  phase: SkyPhase;
  phaseProgress: number;
  weatherCondition: WeatherCondition;
};

// --- 色定義 ---
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

// 雨系の天気で空をどんよりさせる
// tint: 混ぜる先の色, amount: 混ぜる割合（0=元のまま, 1=完全にtint色）
// 昼の場合、amountが0に近づいていくと空が暗くなる
const WEATHER_TINT: Partial<
  Record<WeatherCondition, { tint: string; amount: number }>
> = {
  drizzle: { tint: "#8a8a9a", amount: 0.25 },
  rain: { tint: "#6b6b7d", amount: 1.2 },
  thunderstorm: { tint: "#4a4a5c", amount: 0.55 },
  snow: { tint: "#a0a0b0", amount: 1.1 },
};

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
// 雲を構成する楕円パーツ
type CloudBlob = { dx: number; dy: number; rx: number; ry: number };
type Cloud = {
  x: number;
  y: number;
  width: number;
  speed: number;
  opacity: number;
  blobs: CloudBlob[];
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

function generateCloudBlobs(width: number): CloudBlob[] {
  // 芯になる大きい楕円
  const coreCount = Math.random() < 0.5 ? 3 : 5;
  const blobs: CloudBlob[] = [];

  for (let i = 0; i < coreCount; i++) {
    blobs.push({
      dx: (i - (coreCount - 1) / 2) * width * 0.15,
      dy: 0,
      rx: width * (0.3 + Math.random() * 0.1),
      ry: width * (0.15 + Math.random() * 0.05),
    });
  }

  // 上のモコモコ
  const topCount = 30 + Math.floor(Math.random() * 50);
  for (let i = 0; i < topCount; i++) {
    const spread = (i / (topCount - 1)) * 2 - 1; // -1 〜 1
    blobs.push({
      dx: spread * width * (0.25 + Math.random() * 0.1),
      dy: -(width * (0.08 + Math.random() * 0.12)),
      rx: width * (0.12 + Math.random() * 0.12),
      ry: width * (0.1 + Math.random() * 0.08),
    });
  }

  // 下側にちょっとはみ出す楕円
  const bottomCount = 10 + Math.floor(Math.random() * 20);
  for (let i = 0; i < bottomCount; i++) {
    blobs.push({
      dx: (Math.random() - 0.5) * width * 0.3,
      dy: width * (0.02 + Math.random() * 0.06),
      rx: width * (0.15 + Math.random() * 0.1),
      ry: width * (0.06 + Math.random() * 0.04),
    });
  }

  return blobs;
}

function createClouds(count: number, w: number, h: number): Cloud[] {
  return Array.from({ length: count }, () => {
    const width = Math.random() * 200 + 100;
    return {
      x: Math.random() * w,
      y: Math.random() * h * 0.4 + h * 0.05,
      width,
      speed: Math.random() * 0.3 + 0.1,
      opacity: Math.random() * 0.3 + 0.15,
      blobs: generateCloudBlobs(width),
    };
  });
}

// --- 描画関数 ---
function drawSkyGradient(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  phase: SkyPhase,
  progress: number,
  weather: WeatherCondition
) {
  const phaseIdx = PHASE_ORDER.indexOf(phase);
  const prevPhase = PHASE_ORDER[(phaseIdx - 1 + 4) % 4];
  const currentColors = SKY_COLORS[phase];
  const prevColors = SKY_COLORS[prevPhase];

  // 秘伝のどんより
  const tintConfig = WEATHER_TINT[weather];

  // フェーズの最初の20%は前フェーズからブレンド
  const blendT = progress < 0.2 ? progress / 0.2 : 1;

  const grad = ctx.createLinearGradient(0, 0, 0, h);
  for (let i = 0; i < 3; i++) {
    let color = lerpColor(prevColors[i], currentColors[i], blendT);
    if (tintConfig)
      color = lerpColor(color, tintConfig.tint, tintConfig.amount);
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

    for (const blob of cloud.blobs) {
      ctx.beginPath();
      ctx.ellipse(
        cloud.x + blob.dx,
        cloud.y + blob.dy,
        blob.rx,
        blob.ry,
        0,
        0,
        Math.PI * 2
      );
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
  // todo: 雷の時はすげ〜暴風雨にしたい
  ctx.strokeStyle = "rgba(193, 200, 231, 0.4)";
  ctx.lineWidth = 1;
  for (const drop of drops) {
    drop.y += drop.speed;
    drop.x -= drop.speed * (0.1 + Math.random() * 0.2);
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

      // 空のグラデーション
      drawSkyGradient(ctx, cw, ch, phase, phaseProgress, weatherCondition);

      if (reducedMotion) {
        // アニメーション無効時はグラデーションだけ
        return;
      }

      drawStars(ctx, starsRef.current, time, phase, phaseProgress);

      drawSun(ctx, cw, ch, phase, phaseProgress);
      drawMoon(ctx, cw, ch, phase, phaseProgress);

      if (
        weatherCondition === "clouds" ||
        weatherCondition === "rain" ||
        weatherCondition === "drizzle" ||
        weatherCondition === "thunderstorm" ||
        weatherCondition === "snow"
      ) {
        drawClouds(ctx, cloudsRef.current, cw);
      }

      if (
        weatherCondition === "rain" ||
        weatherCondition === "drizzle" ||
        weatherCondition === "thunderstorm"
      ) {
        drawRain(ctx, rainRef.current, ch, cw);
      }

      if (weatherCondition === "snow") {
        drawSnow(ctx, snowRef.current, ch, cw, time);
      }

      if (weatherCondition === "thunderstorm") {
        // 雷未実装 ⚡️
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
