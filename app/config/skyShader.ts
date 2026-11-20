/**
 * 空の WebGL 演出 (シェーダー雲・ガラスの雨粒) の調整値。
 * GLSL 内の細かい定数は各シェーダーに置き、ここには JS 側で扱う値だけを置く。
 */

export const CLOUD_SHADER = {
  /** 描画解像度 (CSS px に対する倍率)。負荷を抑えるため低めに描いて引き伸ばす */
  resolution: { desktop: 0.66, mobile: 0.5 },
  /** ノイズ 1 単位あたりの CSS px。大きいほど雲がゆったり大きくなる */
  scale: 300,
  /** 横流れの速さ (CSS px/s) = base + wind * windFactor */
  drift: { base: 10, windFactor: 40 },
  /** 全体の不透明度 */
  opacity: 0.92,
} as const;

export const RAIN_GLASS = {
  /** 同時に滑り落ちる大粒の上限 */
  maxDrops: { desktop: 24, mobile: 10 },
  /** 雨の強さ 1 のときの大粒の発生数 (個/s) */
  spawnPerSec: 1.8,
  /** 描画解像度の上限 (devicePixelRatio をこれで頭打ちにする) */
  pixelRatioMax: 1.5,
  /** 強い雨でガラスが曇る最大量 (0..1) */
  fogMax: 0.3,
} as const;

/** 空の減色ディザ (お試し)。levels=6 で 216 色 (Web セーフパレット相当) */
export const SKY_DITHER = {
  enabled: false,
  /** 1 チャンネルあたりの階調数 */
  levels: 6,
  /** ドットの大きさ (CSS px) */
  pixel: 2,
  /** ディザの強さ (0 で単純な減色、1 で Bayer 4x4 をフルに掛ける) */
  spread: 1,
};

/** 描画方式を切り替えるときの走査線 (ログの時間は config/motion.ts の SYSTEM_LOG) */
export const SKY_SWAP = {
  /** 走査線が画面の端から端まで進む時間 (ms)。途中で反転したときは残りの距離に比例して短くなる */
  sweepMs: 900,
} as const;
