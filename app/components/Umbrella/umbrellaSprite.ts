/**
 * ドット絵の傘のスプライト (21 x 20 ドット)。
 * 形は手で並べると左右がずれやすいので、ドーム・パネル・裾のスカラップを規則から生成する。
 * 開き具合 (open) を変えると、閉じた傘から全開までのコマを同じ規則で作れる。
 */

export const UMBRELLA_COLS = 21;
export const UMBRELLA_ROWS = 20;

const PALETTE = {
  outline: "#232946",
  pink: "#eebbc3",
  pinkShade: "#d495a3",
  cream: "#fffaf3",
  creamShade: "#dcd6ec",
  highlight: "#ffffff",
  handle: "#f2c57c",
  handleShade: "#c9944f",
} as const;

type Color = (typeof PALETTE)[keyof typeof PALETTE];

/** 同じ色の横並びをまとめた矩形 (SVG の要素数を減らすため) */
export type PixelRun = { x: number; y: number; w: number; color: Color };

const CENTER = 10;
const CANOPY_TOP = 1;
const CANOPY_BOTTOM = 10;
/** 骨 (パネルの境目) の裾での位置 (全開時) */
const SEAMS = [4, 8, 12, 16];
/** 裾のスカラップ: 各パネルの中央が 1 段下に膨らむ (全開時) */
const SCALLOP = [1, 2, 6, 10, 14, 18, 19];

/** 中心からの距離を開き具合で縮めた列 */
const squeeze = (x: number, open: number) => Math.round(CENTER + (x - CENTER) * open);

function makeShape(open: number) {
  // 半分以上開くまでは布が畳まれていて、裾の凹凸は出ない
  const pleated = open >= 0.5;
  const seams = pleated ? SEAMS.map((s) => squeeze(s, open)) : [];
  const scallop = new Set(pleated ? SCALLOP.map((x) => squeeze(x, open)) : []);

  const inCanopy = (x: number, y: number): boolean => {
    if (y === CANOPY_BOTTOM + 1) return scallop.has(x);
    if (y < CANOPY_TOP || y > CANOPY_BOTTOM) return false;
    if (y === CANOPY_BOTTOM && seams.includes(x)) return false;
    // ドーム: 上ほど狭い半楕円。閉じるほど細くなる
    const t = (CANOPY_BOTTOM + 0.5 - (y + 0.5)) / 9.5;
    const halfWidth = Math.max(0.5, 10.4 * open * Math.sqrt(Math.max(0, 1 - t * t)));
    return Math.abs(x - CENTER) <= halfWidth;
  };

  const canopyColor = (x: number, y: number): Color => {
    const neighbors = [
      [x, y - 1],
      [x - 1, y],
      [x + 1, y],
      [x, y + 1],
    ];
    if (neighbors.some(([nx, ny]) => !inCanopy(nx, ny))) return PALETTE.outline;

    // パネルは先端から放射状に分かれる。裾の位置に投影してどのパネルかを決める
    const spread = (CANOPY_BOTTOM - 0.5) / Math.max(0.5, y - 0.5) / open;
    const bx = CENTER + (x - CENTER) * spread;
    const panel = SEAMS.filter((s) => bx > s).length;
    const pinkPanel = panel % 2 === 0;

    // 左上の縁に光、裾に影
    if (x < CENTER && !inCanopy(x, y - 2)) return PALETTE.highlight;
    if (!inCanopy(x, y + 2)) return pinkPanel ? PALETTE.pinkShade : PALETTE.creamShade;
    return pinkPanel ? PALETTE.pink : PALETTE.cream;
  };

  return (x: number, y: number): Color | null => {
    if (inCanopy(x, y)) return canopyColor(x, y);
    // 先端
    if (x === CENTER && y === 0) return PALETTE.outline;
    // 柄 (シャフト)
    if (x === CENTER && y >= 12 && y <= 15) return PALETTE.outline;
    // 持ち手 (J 字)
    if (x === CENTER && y >= 16 && y <= 18) return PALETTE.handle;
    if (y === 19 && (x === 8 || x === 9)) return PALETTE.handleShade;
    if (x === 7 && y === 18) return PALETTE.handle;
    return null;
  };
}

/** 開き具合 (0 に近いほど閉じている, 1 で全開) のスプライト */
export function buildUmbrellaPixels(open = 1): PixelRun[] {
  const pixelAt = makeShape(open);
  const runs: PixelRun[] = [];
  for (let y = 0; y < UMBRELLA_ROWS; y++) {
    let run: PixelRun | null = null;
    for (let x = 0; x < UMBRELLA_COLS; x++) {
      const color = pixelAt(x, y);
      if (run && color === run.color) {
        run.w += 1;
        continue;
      }
      if (run) runs.push(run);
      run = color ? { x, y, w: 1, color } : null;
    }
    if (run) runs.push(run);
  }
  return runs;
}
