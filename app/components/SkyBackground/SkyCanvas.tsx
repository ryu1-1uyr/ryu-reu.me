"use client";

import { useRef, useEffect } from "react";
import type { SkyPhase, WeatherCondition } from "@/types/weather";
import type { SkyDrawing } from "@/app/contexts/SkyDrawings";

type Props = {
  phase: SkyPhase;
  phaseProgress: number;
  weatherCondition: WeatherCondition;
  skyDrawings?: SkyDrawing[];
  targetFps?: number; // 省略時は 60fps
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
type CloudCache = {
  canvas: HTMLCanvasElement;
  ox: number; // blobs の左端オフセット（描画時に cloud.x + ox で配置）
  oy: number;
};
type Cloud = {
  x: number;
  y: number;
  width: number;
  speed: number;
  opacity: number;
  blobs: CloudBlob[];
  cache?: CloudCache;
};

// 流れ星
type ShootingStar = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  length: number;
  life: number; // 残り寿命 (0〜1)
  maxLife: number; // 初期寿命
  brightness: number; // 明るさ (0.6〜1.0)
  emoji?: string; // セットされてたら絵文字モード
};

const SHOOTING_EMOJIS = [
  "🍣",
  "🐈",
  "🍜",
  "🌙",
  "⭐",
  "🎸",
  "🍡",
  "🐙",
  "💩",
  "🍺",
  "🎮",
  "🚀",
  "💎",
  "🔥",
  "🍕",
  "👾",
];

type ShootingStarState = {
  stars: ShootingStar[];
  nextSpawnMs: number; // 次の出現までの残り時間
};

function createShootingStarState(): ShootingStarState {
  return { stars: [], nextSpawnMs: 3000 + Math.random() * 5000 };
}

function spawnShootingStar(
  w: number,
  h: number,
  forceEmoji?: boolean
): ShootingStar {
  const x = Math.random() * w;
  const y = Math.random() * h * 0.3;
  const angle =
    Math.PI * (0.55 + Math.random() * 0.35) * (Math.random() < 0.5 ? 1 : -1);

  // 絵文字モード: 15% の確率（or 強制）
  const isEmoji = forceEmoji || Math.random() < 0.15;
  const speed = isEmoji ? 2 + Math.random() * 2 : 4 + Math.random() * 4;
  const maxLife = isEmoji
    ? 1.2 + Math.random() * 1.0
    : 0.6 + Math.random() * 0.6;

  return {
    x,
    y,
    vx: Math.cos(angle) * speed,
    vy: Math.abs(Math.sin(angle)) * speed,
    length: isEmoji ? 0 : 30 + Math.random() * 50,
    life: maxLife,
    maxLife,
    brightness: isEmoji ? 1 : 0.6 + Math.random() * 0.4,
    emoji: isEmoji
      ? SHOOTING_EMOJIS[Math.floor(Math.random() * SHOOTING_EMOJIS.length)]
      : undefined,
  };
}

function tickShootingStars(
  state: ShootingStarState,
  w: number,
  h: number,
  deltaMs: number,
  isNight: boolean
) {
  const dtSec = deltaMs / 1000;

  // 夜以外は新規生成しない（既存は消えるまで描画）
  if (isNight) {
    state.nextSpawnMs -= deltaMs;
    if (state.nextSpawnMs <= 0) {
      state.stars.push(spawnShootingStar(w, h));
      state.nextSpawnMs = 5000 + Math.random() * 10000; // 5〜15秒後に次
    }
  }

  // 更新 & 寿命切れ除去
  state.stars = state.stars.filter((s) => {
    s.x += s.vx * dtSec * 60;
    s.y += s.vy * dtSec * 60;
    s.life -= dtSec;
    return s.life > 0;
  });
}

function drawShootingStars(
  ctx: CanvasRenderingContext2D,
  state: ShootingStarState
) {
  for (const s of state.stars) {
    const alpha = Math.min(s.life / s.maxLife, 1) * s.brightness;
    if (alpha <= 0) continue;

    ctx.save();
    ctx.globalAlpha = alpha;

    if (s.emoji) {
      // 絵文字モード: 進行方向にちょっと回転させて飛ばす
      const angle = Math.atan2(s.vy, s.vx);
      ctx.translate(s.x, s.y);
      ctx.rotate(angle * 0.3);
      ctx.font = "20px serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(s.emoji, 0, 0);
    } else {
      // 通常の流れ星
      const speed = Math.sqrt(s.vx * s.vx + s.vy * s.vy);
      const nx = -s.vx / speed;
      const ny = -s.vy / speed;
      const tailX = s.x + nx * s.length;
      const tailY = s.y + ny * s.length;

      const grad = ctx.createLinearGradient(s.x, s.y, tailX, tailY);
      grad.addColorStop(0, `rgba(255, 255, 255, ${alpha})`);
      grad.addColorStop(0.3, `rgba(200, 210, 240, ${alpha * 0.5})`);
      grad.addColorStop(1, "rgba(200, 210, 240, 0)");

      ctx.globalAlpha = 1;
      ctx.strokeStyle = grad;
      ctx.lineWidth = 1.5;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(s.x, s.y);
      ctx.lineTo(tailX, tailY);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(s.x, s.y, 2, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
      ctx.fill();
    }

    ctx.restore();
  }
}

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
  progress: number,
  time: number
) {
  if (phase === "night") return;

  let x: number, y: number, opacity: number;

  if (phase === "sunrise") {
    x = w * 0.8;
    y = h * (0.9 - progress * 0.5);
    opacity = Math.min(1, progress * 2);
  } else if (phase === "day") {
    const angle = Math.PI * (0.1 + progress * 0.8);
    x = w * (0.2 + progress * 0.6);
    y = h * (0.4 - Math.sin(angle) * 0.25);
    opacity = 1;
  } else {
    x = w * 0.2;
    y = h * (0.4 + progress * 0.5);
    opacity = Math.max(0, 1 - progress * 1.5);
  }

  if (opacity <= 0) return;

  const R = 30;
  ctx.save();
  ctx.globalAlpha = opacity;

  // --- 1. 軽めのグロー ---
  const grd = ctx.createRadialGradient(x, y, R * 0.5, x, y, R * 2.5);
  grd.addColorStop(0, "rgba(255, 245, 220, 0.12)");
  grd.addColorStop(1, "rgba(242, 197, 124, 0)");
  ctx.beginPath();
  ctx.arc(x, y, R * 2.5, 0, Math.PI * 2);
  ctx.fillStyle = grd;
  ctx.fill();

  // --- 2. コロナ（ゆらゆら動く光の輪） ---
  const coronaCount = 5;
  for (let i = 0; i < coronaCount; i++) {
    const baseAngle = (Math.PI * 2 * i) / coronaCount;
    // 各コロナが独立した周期でゆらゆら
    const wobble = Math.sin(time * 0.0008 + i * 1.7) * 0.3;
    const pulse = 1 + Math.sin(time * 0.0012 + i * 2.3) * 0.15;
    const a = baseAngle + wobble;
    const dist = R * 0.15;
    const cx = x + Math.cos(a) * dist;
    const cy = y + Math.sin(a) * dist;
    const outerR = R * (1.4 + pulse * 0.3);

    const cGrad = ctx.createRadialGradient(cx, cy, R * 0.8, cx, cy, outerR);
    cGrad.addColorStop(0, "rgba(255, 235, 180, 0)");
    cGrad.addColorStop(0.4, `rgba(255, 225, 160, ${0.06 + pulse * 0.03})`);
    cGrad.addColorStop(1, "rgba(242, 197, 124, 0)");
    ctx.beginPath();
    ctx.arc(cx, cy, outerR, 0, Math.PI * 2);
    ctx.fillStyle = cGrad;
    ctx.fill();
  }

  // --- 3. 本体（白〜淡黄のシンプルな円） ---
  const bodyGrad = ctx.createRadialGradient(x, y, 0, x, y, R);
  bodyGrad.addColorStop(0, "#fffef5");
  bodyGrad.addColorStop(0.4, "#fff8e0");
  bodyGrad.addColorStop(1, "#f9deb2");
  ctx.beginPath();
  ctx.arc(x, y, R, 0, Math.PI * 2);
  ctx.fillStyle = bodyGrad;
  ctx.fill();

  ctx.restore();
}

// 月面クレーターの配置（正規化座標: -1〜1）
const MOON_CRATERS = [
  { dx: -0.3, dy: -0.25, r: 0.12 },
  { dx: 0.15, dy: -0.4, r: 0.08 },
  { dx: -0.1, dy: 0.3, r: 0.15 },
  { dx: 0.35, dy: 0.1, r: 0.1 },
  { dx: -0.4, dy: 0.05, r: 0.07 },
  { dx: 0.05, dy: -0.05, r: 0.18 },
  { dx: 0.25, dy: 0.35, r: 0.09 },
];

function drawMoon(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  phase: SkyPhase,
  progress: number
) {
  if (phase !== "night") return;

  const R = 28;
  const angle = Math.PI * (0.1 + progress * 0.8);
  const cx = w * (0.2 + progress * 0.6);
  const cy = h * (0.3 - Math.sin(angle) * 0.15);

  ctx.save();

  // --- 1. 大気グロー（多層） ---
  const glowLayers = [
    { radius: R * 4.5, alpha: 0.03 },
    { radius: R * 3.0, alpha: 0.06 },
    { radius: R * 2.0, alpha: 0.1 },
    { radius: R * 1.5, alpha: 0.15 },
  ];
  for (const gl of glowLayers) {
    const grd = ctx.createRadialGradient(cx, cy, R * 0.5, cx, cy, gl.radius);
    grd.addColorStop(0, `rgba(184, 193, 236, ${gl.alpha})`);
    grd.addColorStop(1, "rgba(184, 193, 236, 0)");
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.arc(cx, cy, gl.radius, 0, Math.PI * 2);
    ctx.fill();
  }

  // --- 2〜6: オフスクリーンで月ディスクを描く ---
  // destination-out がグローを巻き込まないように隔離する
  const pad = 4;
  const offSize = (R + pad) * 2;
  const off = document.createElement("canvas");
  off.width = offSize;
  off.height = offSize;
  const oc = off.getContext("2d")!;
  // オフスクリーン上の月中心
  const ocx = R + pad;
  const ocy = R + pad;

  // 地球照（暗い側のうっすらした光）
  oc.beginPath();
  oc.arc(ocx, ocy, R + 1, 0, Math.PI * 2);
  const earthshine = oc.createRadialGradient(
    ocx + R * 0.3,
    ocy - R * 0.2,
    R * 0.1,
    ocx,
    ocy,
    R + 1
  );
  earthshine.addColorStop(0, "rgba(100, 120, 180, 0.12)");
  earthshine.addColorStop(0.6, "rgba(80, 100, 160, 0.06)");
  earthshine.addColorStop(1, "rgba(60, 80, 140, 0)");
  oc.fillStyle = earthshine;
  oc.fill();

  // 月本体（球体グラデーション）
  oc.beginPath();
  oc.arc(ocx, ocy, R, 0, Math.PI * 2);
  const bodyGrad = oc.createRadialGradient(
    ocx - R * 0.3,
    ocy - R * 0.3,
    R * 0.1,
    ocx,
    ocy,
    R
  );
  bodyGrad.addColorStop(0, "#e8ecf8");
  bodyGrad.addColorStop(0.4, "#c8cfea");
  bodyGrad.addColorStop(0.75, "#b0b8d8");
  bodyGrad.addColorStop(1, "#8a94be");
  oc.fillStyle = bodyGrad;
  oc.fill();

  // クレーター
  for (const cr of MOON_CRATERS) {
    const crx = ocx + cr.dx * R;
    const cry = ocy + cr.dy * R;
    const crr = cr.r * R;
    const crGrad = oc.createRadialGradient(
      crx - crr * 0.2,
      cry - crr * 0.2,
      crr * 0.1,
      crx,
      cry,
      crr
    );
    crGrad.addColorStop(0, "rgba(140, 148, 185, 0.25)");
    crGrad.addColorStop(0.7, "rgba(120, 128, 170, 0.15)");
    crGrad.addColorStop(1, "rgba(100, 110, 155, 0)");
    oc.beginPath();
    oc.arc(crx, cry, crr, 0, Math.PI * 2);
    oc.fillStyle = crGrad;
    oc.fill();
  }

  // #0d1b2a
  // 三日月シャドウ（source-atop で月の上にだけ夜空色を重ねる）
  oc.globalCompositeOperation = "source-atop";
  const shadowGrad = oc.createRadialGradient(
    ocx + R * 0.55,
    ocy - R * 0.55,
    R * 0.5,
    ocx + R * 0.45,
    ocy - R * 0.3,
    R * 1.02
  );
  const shadowColor = "rgba(11, 15, 39, 0.97)";
  shadowGrad.addColorStop(0, shadowColor);
  shadowGrad.addColorStop(0.58, shadowColor);
  shadowGrad.addColorStop(1, "rgba(35, 41, 70, 0)");
  oc.beginPath();
  oc.arc(ocx + R * 0.45, ocy - R * 0.1, R * 1.05, 0, Math.PI * 2);
  oc.fillStyle = shadowGrad;
  oc.fill();
  oc.globalCompositeOperation = "source-over";

  // リムライト
  oc.beginPath();
  oc.arc(ocx, ocy, R, 0, Math.PI * 2);
  const rimGrad = oc.createRadialGradient(
    ocx - R * 0.5,
    ocy - R * 0.3,
    R * 0.6,
    ocx,
    ocy,
    R
  );
  rimGrad.addColorStop(0, "rgba(255, 255, 255, 0)");
  rimGrad.addColorStop(0.85, "rgba(255, 255, 255, 0)");
  rimGrad.addColorStop(0.95, "rgba(220, 225, 245, 0.3)");
  rimGrad.addColorStop(1, "rgba(200, 210, 240, 0.1)");
  oc.fillStyle = rimGrad;
  oc.fill();

  // オフスクリーンをメインキャンバスに転写
  ctx.drawImage(off, cx - ocx, cy - ocy);

  ctx.restore();
}

// 雲の形をオフスクリーンCanvasに1回だけ焼く
function ensureCloudCache(cloud: Cloud): CloudCache {
  if (cloud.cache) return cloud.cache;

  const pad = 2; // ぼやけ防止の余白
  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;
  for (const b of cloud.blobs) {
    minX = Math.min(minX, b.dx - b.rx);
    minY = Math.min(minY, b.dy - b.ry);
    maxX = Math.max(maxX, b.dx + b.rx);
    maxY = Math.max(maxY, b.dy + b.ry);
  }

  const cw = Math.ceil(maxX - minX) + pad * 2;
  const ch = Math.ceil(maxY - minY) + pad * 2;
  const offCanvas = document.createElement("canvas");
  offCanvas.width = cw;
  offCanvas.height = ch;
  const offCtx = offCanvas.getContext("2d")!;

  offCtx.fillStyle = "rgba(255, 255, 255, 0.8)";
  for (const blob of cloud.blobs) {
    offCtx.beginPath();
    offCtx.ellipse(
      blob.dx - minX + pad,
      blob.dy - minY + pad,
      blob.rx,
      blob.ry,
      0,
      0,
      Math.PI * 2
    );
    offCtx.fill();
  }

  cloud.cache = { canvas: offCanvas, ox: minX - pad, oy: minY - pad };
  return cloud.cache;
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

    const c = ensureCloudCache(cloud);
    ctx.save();
    ctx.globalAlpha = cloud.opacity;
    ctx.drawImage(c.canvas, cloud.x + c.ox, cloud.y + c.oy);
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
  targetFps = 60,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const starsRef = useRef<Star[]>([]);
  const rainRef = useRef<Raindrop[]>([]);
  const snowRef = useRef<Snowflake[]>([]);
  const cloudsRef = useRef<Cloud[]>([]);
  const lightningRef = useRef<LightningState>(createLightningState());
  const shootingRef = useRef<ShootingStarState>(createShootingStarState());
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
    const gradColors = computeGradientColors(
      phase,
      phaseProgress,
      weatherCondition
    );
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

    const frameInterval = targetFps < 60 ? 1000 / targetFps : 0;
    let lastRenderTime = startTime;

    const render = () => {
      if (!running) return;

      const now = performance.now();

      // FPS 制限: 目標フレーム間隔に達してなければスキップ
      if (frameInterval > 0 && now - lastRenderTime < frameInterval) {
        animId = requestAnimationFrame(render);
        return;
      }
      lastRenderTime = now;
      const deltaMs = Math.min(now - prevTime, 100); // タブ復帰時のジャンプ防止
      const dt = deltaMs / (1000 / 60); // 60fps を基準とした比率
      prevTime = now;

      const time = now - startTime;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const cw = w();
      const ch = h();

      gradCache = drawSkyGradient(ctx, cw, ch, gradColors, gradCache);

      drawStars(ctx, starsRef.current, time, phase, phaseProgress);

      // 流れ星（星と同じ層、月より奥）
      tickShootingStars(
        shootingRef.current,
        cw,
        ch,
        deltaMs,
        phase === "night"
      );
      drawShootingStars(ctx, shootingRef.current);

      drawSun(ctx, cw, ch, phase, phaseProgress, time);
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
