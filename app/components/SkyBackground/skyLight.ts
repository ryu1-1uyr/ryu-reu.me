import type { SkyPhase } from "@/types/weather";
import { hexToRgb } from "./gl/glUtils";

type Point = { x: number; y: number };

/** 太陽の位置と見え方。夜は null */
export function sunPosition(
  w: number,
  h: number,
  phase: SkyPhase,
  progress: number,
): (Point & { opacity: number }) | null {
  if (phase === "night") return null;
  if (phase === "sunrise") {
    return {
      x: w * 0.8,
      y: h * (0.9 - progress * 0.5),
      opacity: Math.min(1, progress * 2),
    };
  }
  if (phase === "day") {
    const angle = Math.PI * (0.1 + progress * 0.8);
    return {
      x: w * (0.2 + progress * 0.6),
      y: h * (0.4 - Math.sin(angle) * 0.25),
      opacity: 1,
    };
  }
  return {
    x: w * 0.2,
    y: h * (0.4 + progress * 0.5),
    opacity: Math.max(0, 1 - progress * 1.5),
  };
}

/** 月の位置 (夜のみ出る) */
export function moonPosition(w: number, h: number, progress: number): Point {
  const angle = Math.PI * (0.1 + progress * 0.8);
  return {
    x: w * (0.2 + progress * 0.6),
    y: h * (0.3 - Math.sin(angle) * 0.15),
  };
}

/** 雲を照らす光源。夜は月、それ以外は太陽 */
export function lightSource(
  w: number,
  h: number,
  phase: SkyPhase,
  progress: number,
): Point {
  if (phase === "night") return moonPosition(w, h, progress);
  return sunPosition(w, h, phase, progress) ?? { x: w * 0.5, y: 0 };
}

type Rgb = [number, number, number];

export type CloudPalette = {
  /** 光が当たる面 */
  lit: Rgb;
  /** 中間 */
  mid: Rgb;
  /** 影 */
  shade: Rgb;
  /** 光源側の縁 (朝焼け・夕焼けで色づく) */
  rim: Rgb;
  /** 縁の色づきの強さ */
  rimAmount: number;
};

type PaletteHex = { lit: string; mid: string; shade: string; rim: string; rimAmount: number };

// サイトパレット (#232946, #b8c1ec, #eebbc3, #f2c57c) 寄り
const PALETTES: Record<SkyPhase, PaletteHex> = {
  day: { lit: "#ffffff", mid: "#e4e8f8", shade: "#b8c1ec", rim: "#ffffff", rimAmount: 0 },
  sunrise: { lit: "#fff0ec", mid: "#eebbc3", shade: "#8a6b7a", rim: "#f2c57c", rimAmount: 0.8 },
  sunset: { lit: "#ffe5c6", mid: "#e2a2a8", shade: "#6e4e68", rim: "#f2c57c", rimAmount: 0.9 },
  night: { lit: "#5d6798", mid: "#3b4471", shade: "#262d4f", rim: "#b8c1ec", rimAmount: 0.6 },
};

// 嵐の雲 (darkness が高いほどこちらに寄る)
const STORM = { lit: "#a3a8be", mid: "#727892", shade: "#464c64" };

const PHASE_ORDER: SkyPhase[] = ["night", "sunrise", "day", "sunset"];

function mix(a: Rgb, b: Rgb, t: number): Rgb {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
}

/** 時間帯と天気から雲の配色を決める。フェーズ切り替え直後は前のフェーズから補間する */
export function cloudPalette(
  phase: SkyPhase,
  progress: number,
  darkness: number,
): CloudPalette {
  const prev = PALETTES[PHASE_ORDER[(PHASE_ORDER.indexOf(phase) + 3) % 4]];
  const cur = PALETTES[phase];
  // 空のグラデーションと同じく、フェーズ先頭 20% で前フェーズから移る
  const t = progress < 0.2 ? progress / 0.2 : 1;
  const blend = (key: "lit" | "mid" | "shade" | "rim") =>
    mix(hexToRgb(prev[key]), hexToRgb(cur[key]), t);

  // 夜の嵐雲は暗いまま (灰色に寄せると夜空から浮く)
  const storm = Math.min(1, darkness) * (phase === "night" ? 0.3 : 0.85);
  return {
    lit: mix(blend("lit"), hexToRgb(STORM.lit), storm),
    mid: mix(blend("mid"), hexToRgb(STORM.mid), storm),
    shade: mix(blend("shade"), hexToRgb(STORM.shade), storm),
    rim: blend("rim"),
    rimAmount: (prev.rimAmount + (cur.rimAmount - prev.rimAmount) * t) * (1 - storm),
  };
}
