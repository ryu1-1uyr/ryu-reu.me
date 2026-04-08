"use client";

import { useRef, useEffect } from "react";
import type { SkyPhase, WeatherCondition } from "@/types/weather";
import type { SkyDrawing } from "@/app/contexts/SkyDrawings";

type Props = {
  phase: SkyPhase;
  phaseProgress: number;
  weatherCondition: WeatherCondition;
  skyDrawings?: SkyDrawing[];
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

// 稲妻の頂点リスト（メインボルト + サブボルト）
type Bolt = { x: number; y: number }[];
type LightningState = {
  active: boolean;
  remainingMs: number; // 残り表示時間 (ms)
  durationMs: number; // 光る合計時間 (ms)（ボルト不透明度計算用）
  nextStrikeMs: number; // 次の雷までの時間 (ms)
  bolts: Bolt[];
  flashOpacity: number;
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

// --- 稲妻生成 ---
function generateBolt(startX: number, startY: number, maxY: number): Bolt {
  const points: Bolt = [{ x: startX, y: startY }];
  let x = startX;
  let y = startY;
  const steps = 10 + Math.floor(Math.random() * 6);
  for (let i = 0; i < steps; i++) {
    x += (Math.random() - 0.5) * 60;
    y += Math.random() * 20 + 20;
    if (y > maxY) break;
    points.push({ x, y });
  }
  return points;
}

function generateLightningBolts(w: number, h: number): Bolt[] {
  const bolts: Bolt[] = [];
  const startX = Math.random() * w;
  // メインボルト
  const main = generateBolt(startX, 0, h * 0.7);
  bolts.push(main);
  // 30% の確率でサブボルト（途中の頂点から分岐）
  if (main.length > 4 && Math.random() < 0.3) {
    const branchIdx = 2 + Math.floor(Math.random() * (main.length - 3));
    const branch = generateBolt(main[branchIdx].x, main[branchIdx].y, h * 0.7);
    bolts.push(branch);
  }
  return bolts;
}

function createLightningState(): LightningState {
  return {
    active: false,
    remainingMs: 0,
    durationMs: 0,
    nextStrikeMs: 2000 + Math.random() * 5000, // 2〜7秒
    bolts: [],
    flashOpacity: 0,
  };
}

// --- 描画関数 ---

// グラデーションの色を事前計算する（phase/progress/weather が同じなら結果も同じ）
function computeGradientColors(
  phase: SkyPhase,
  progress: number,
  weather: WeatherCondition
): [string, string, string] {
  const phaseIdx = PHASE_ORDER.indexOf(phase);
  const prevPhase = PHASE_ORDER[(phaseIdx - 1 + 4) % 4];
  const currentColors = SKY_COLORS[phase];
  const prevColors = SKY_COLORS[prevPhase];

  const tintConfig = WEATHER_TINT[weather];
  const blendT = progress < 0.2 ? progress / 0.2 : 1;

  const colors: string[] = [];
  for (let i = 0; i < 3; i++) {
    let color = lerpColor(prevColors[i], currentColors[i], blendT);
    if (phase !== "night" && phase !== "sunset" && tintConfig) {
      color = lerpColor(color, tintConfig.tint, tintConfig.amount);
    }
    colors.push(color);
  }
  return colors as [string, string, string];
}

function drawSkyGradient(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  gradColors: [string, string, string],
  cachedGrad: { h: number; grad: CanvasGradient } | null
): { h: number; grad: CanvasGradient } {
  let entry = cachedGrad;
  if (!entry || entry.h !== h) {
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    for (let i = 0; i < 3; i++) {
      grad.addColorStop(i / 2, gradColors[i]);
    }
    entry = { h, grad };
  }
  ctx.fillStyle = entry.grad;
  ctx.fillRect(0, 0, w, h);
  return entry;
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

function drawClouds(
  ctx: CanvasRenderingContext2D,
  clouds: Cloud[],
  w: number,
  dt: number
) {
  for (const cloud of clouds) {
    cloud.x += cloud.speed * dt;
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
  w: number,
  isThunderstorm = false,
  dt = 1
) {
  const speedMul = isThunderstorm ? 1.3 : 1;
  const windJitter = isThunderstorm ? 0.4 : 0.2;
  ctx.strokeStyle = isThunderstorm
    ? "rgba(193, 200, 231, 0.55)"
    : "rgba(193, 200, 231, 0.4)";
  ctx.lineWidth = isThunderstorm ? 1.5 : 1;
  for (const drop of drops) {
    drop.y += drop.speed * speedMul * dt;
    drop.x -= drop.speed * (0.1 + Math.random() * windJitter) * dt;
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

function drawLightning(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  state: LightningState
) {
  // フラッシュ（画面全体を白く光らせる）
  if (state.flashOpacity > 0) {
    ctx.fillStyle = `rgba(255, 255, 255, ${state.flashOpacity})`;
    ctx.fillRect(0, 0, w, h);
  }

  // 稲妻ライン
  if (state.active && state.bolts.length > 0) {
    ctx.save();
    ctx.shadowColor = "#b8c1ec";
    ctx.shadowBlur = 20;
    ctx.lineCap = "round";

    const fadeRatio =
      state.durationMs > 0 ? state.remainingMs / state.durationMs : 0;
    for (let bIdx = 0; bIdx < state.bolts.length; bIdx++) {
      const bolt = state.bolts[bIdx];
      if (bolt.length < 2) continue;
      // メインボルト(0) は太め、サブ(1+) は細め
      ctx.lineWidth = bIdx === 0 ? 2 : 1;
      ctx.strokeStyle =
        bIdx === 0
          ? `rgba(255, 255, 255, ${0.9 * fadeRatio})`
          : `rgba(200, 210, 255, ${0.6 * fadeRatio})`;

      ctx.beginPath();
      ctx.moveTo(bolt[0].x, bolt[0].y);
      for (let i = 1; i < bolt.length; i++) {
        ctx.lineTo(bolt[i].x, bolt[i].y);
      }
      ctx.stroke();
    }
    ctx.restore();
  }
}

function tickLightning(
  state: LightningState,
  w: number,
  h: number,
  deltaMs: number
) {
  if (state.active) {
    state.remainingMs -= deltaMs;
    // 60fps 換算で 0.7^1 のペースで減衰
    state.flashOpacity *= Math.pow(0.7, deltaMs / (1000 / 60));
    if (state.remainingMs <= 0) {
      state.active = false;
      state.flashOpacity = 0;
      state.nextStrikeMs = 2000 + Math.random() * 5000;
    }
  } else {
    state.nextStrikeMs -= deltaMs;
    if (state.nextStrikeMs <= 0) {
      state.active = true;
      const duration = 67; // ~4フレーム分 (ms)
      state.remainingMs = duration;
      state.durationMs = duration;
      state.flashOpacity = 0.12 + Math.random() * 0.08;
      state.bolts = generateLightningBolts(w, h);
    }
  }
}

function drawSnow(
  ctx: CanvasRenderingContext2D,
  flakes: Snowflake[],
  h: number,
  w: number,
  time: number,
  dt = 1
) {
  ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
  for (const flake of flakes) {
    flake.y += flake.speed * dt;
    flake.x += Math.sin(time * 0.001 + flake.driftOffset) * flake.drift * dt;
    if (flake.y > h) {
      flake.y = -flake.radius;
      flake.x = Math.random() * w;
    }

    ctx.beginPath();
    ctx.arc(flake.x, flake.y, flake.radius, 0, Math.PI * 2);
    ctx.fill();
  }
}

// --- ドリフトお絵描き ---
type DriftingDrawing = {
  id: string;
  image: HTMLImageElement;
  x: number;
  y: number;
  displayWidth: number;
  displayHeight: number;
  speed: number;
  opacity: number;
  floatOffset: number; // sin の位相オフセット（ふよふよ）
  floatAmp: number; // 上下振れ幅 (px)
  floatFreq: number; // 上下の周期
};

function drawDriftingDrawings(
  ctx: CanvasRenderingContext2D,
  drawings: DriftingDrawing[],
  w: number,
  time: number,
  dt = 1
) {
  for (const d of drawings) {
    d.x += d.speed * dt;
    if (d.x > w + d.displayWidth) d.x = -d.displayWidth;

    const floatY =
      d.y + Math.sin(time * d.floatFreq + d.floatOffset) * d.floatAmp;

    ctx.save();
    ctx.globalAlpha = d.opacity;
    ctx.drawImage(d.image, d.x, floatY, d.displayWidth, d.displayHeight);
    ctx.restore();
  }
}

// --- メインコンポーネント ---
export default function SkyCanvas({
  phase,
  phaseProgress,
  weatherCondition,
  skyDrawings,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const starsRef = useRef<Star[]>([]);
  const rainRef = useRef<Raindrop[]>([]);
  const snowRef = useRef<Snowflake[]>([]);
  const cloudsRef = useRef<Cloud[]>([]);
  const lightningRef = useRef<LightningState>(createLightningState());
  const driftingDrawingsRef = useRef<DriftingDrawing[]>([]);
  const initedRef = useRef(false);

  // skyDrawings の変化を driftingDrawingsRef に同期
  useEffect(() => {
    if (!skyDrawings || skyDrawings.length === 0) return;
    const currentIds = new Set(driftingDrawingsRef.current.map((d) => d.id));
    const isMobile = window.innerWidth < 768;
    const maxDrawings = isMobile ? 5 : 15;

    for (const drawing of skyDrawings) {
      if (currentIds.has(drawing.id)) continue;

      const img = new Image();
      img.onload = () => {
        const targetSize = 80 + Math.random() * 120; // 80〜200px でランダム
        const scale = Math.min(
          targetSize / drawing.width,
          targetSize / drawing.height
        );
        const displayWidth = drawing.width * scale;
        const displayHeight = drawing.height * scale;
        const w = window.innerWidth;
        const h = window.innerHeight;

        // 上限超えたら古いの除去
        if (driftingDrawingsRef.current.length >= maxDrawings) {
          driftingDrawingsRef.current.shift();
        }

        driftingDrawingsRef.current.push({
          id: drawing.id,
          image: img,
          x: -displayWidth, // 左端から流れてくる
          y: Math.random() * h * 0.6 + h * 0.05, // 上5%〜65%の広い範囲
          displayWidth,
          displayHeight,
          speed: 0.15 + Math.random() * 0.85, // 0.15〜1.0 でランダム
          opacity: Math.random() * 0.3 + 0.4,
          floatOffset: Math.random() * Math.PI * 2, // 各描画ごとに位相をずらす
          floatAmp: 8 + Math.random() * 35, // 8〜8*35 の上下振れ幅
          floatFreq: 0.0003 + Math.random() * 0.0004, // ゆっくり〜少し速めの周期
        });
      };
      img.src = drawing.dataURL;
    }
  }, [skyDrawings]);

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
    let running = true;
    const startTime = performance.now();
    let prevTime = startTime;

    // グラデーション色はphase/progress/weatherが同じ間は不変なのでループ外で1回だけ計算
    const gradColors = computeGradientColors(phase, phaseProgress, weatherCondition);
    let gradCache: { h: number; grad: CanvasGradient } | null = null;

    // reducedMotion: グラデーションだけ 1 回描いて終了、ループしない
    if (reducedMotion) {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      drawSkyGradient(ctx, w(), h(), gradColors, null);
      return () => {
        window.removeEventListener("resize", resize);
      };
    }

    // タブの表示/非表示でアニメーションを一時停止・再開
    const handleVisibility = () => {
      if (document.hidden) {
        cancelAnimationFrame(animId);
        running = false;
      } else {
        if (!running) {
          running = true;
          prevTime = performance.now(); // タブ復帰時の巨大 dt を防止
          animId = requestAnimationFrame(render);
        }
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);

    // 📝 こんな感じの変更をすれば意図的にFPSを落とすことができそう
    // const TARGET_FPS = 30;
    // const FRAME_INTERVAL = 1000 / TARGET_FPS;
    // let lastRenderTime = startTime;

    // const render = () => {
    //   if (!running) return;
    //   const now = performance.now();

    //   // 目標フレーム間隔に達してなければスキップ
    //   if (now - lastRenderTime < FRAME_INTERVAL) {
    //     animId = requestAnimationFrame(render);
    //     return;
    //   }
    //   lastRenderTime = now;

    //   // 以下いつもの描画処理...
    // };

    const render = () => {
      if (!running) return;

      const now = performance.now();
      const deltaMs = Math.min(now - prevTime, 100); // タブ復帰時のジャンプ防止
      const dt = deltaMs / (1000 / 60); // 60fps を基準とした比率
      prevTime = now;

      const time = now - startTime;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const cw = w();
      const ch = h();

      gradCache = drawSkyGradient(ctx, cw, ch, gradColors, gradCache);

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
        drawClouds(ctx, cloudsRef.current, cw, dt);
      }

      // お絵描きドリフト（雲と同じ層）
      if (driftingDrawingsRef.current.length > 0) {
        drawDriftingDrawings(ctx, driftingDrawingsRef.current, cw, time, dt);
      }

      if (
        weatherCondition === "rain" ||
        weatherCondition === "drizzle" ||
        weatherCondition === "thunderstorm"
      ) {
        drawRain(
          ctx,
          rainRef.current,
          ch,
          cw,
          weatherCondition === "thunderstorm",
          dt
        );
      }

      if (weatherCondition === "snow") {
        drawSnow(ctx, snowRef.current, ch, cw, time, dt);
      }

      if (weatherCondition === "thunderstorm") {
        tickLightning(lightningRef.current, cw, ch, deltaMs);
        drawLightning(ctx, cw, ch, lightningRef.current);
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      running = false;
      cancelAnimationFrame(animId);
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("resize", resize);
    };
  }, [phase, phaseProgress, weatherCondition]);

  return <canvas ref={canvasRef} className="block w-full h-full" />;
}
