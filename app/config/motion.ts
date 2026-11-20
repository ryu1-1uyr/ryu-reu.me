// モーションのトークン (JS 側)。CSS 側の対応値は app/globals.css の :root
// 値の根拠: motion-design スキル (timing.md / web-motion-graphics.md)

export const MOTION_EASE = {
  /** 入る: 減速 */
  enter: [0.05, 0.7, 0.1, 1],
  /** 出る: 加速 */
  exit: [0.3, 0, 0.8, 0.15],
  /** 画面内の移動 */
  standard: [0.2, 0, 0, 1],
  /** 矩形が飛ぶ動き: 加速して減速する */
  travel: [0.65, 0, 0.35, 1],
} as const;

/** ズーム矩形 (ウィンドウ開閉の残像)。単位は ms (WAAPI) */
export const ZOOM_RECTS = {
  count: 3,
  duration: 420,
  /** 残像 1 本ごとの遅れ */
  trailDelay: 55,
} as const;

/** 記事ページがウィンドウとして開く。単位は秒 (framer-motion) */
export const PAGE_OPEN = {
  /** ズーム矩形が画面いっぱいに届く少し前から展開を始める */
  delayAfterZoom: 0.3,
  /** タイトルバーの帯が左から伸びる */
  titleWipe: 0.2,
  /** 本体が下へ展開する */
  unfold: 0.42,
  /** ファイル名を打つ */
  titleType: 0.26,
} as const;

/** ウィンドウ・記事ページが閉じる (最小化)。単位は秒 */
export const WINDOW_CLOSE = {
  /** 本体が上へ畳まれる */
  fold: 0.2,
  /** 畳み終わる少し前にズーム矩形をタスクバーへ飛ばす */
  zoomOverlap: 0.08,
} as const;

export const MOTION_DURATION = {
  reduced: 0.12,
} as const;

/** umbrella.exe の傘が開く・閉じる。ドット絵のコマ送り (開き具合 0..1 の列) */
export const UMBRELLA_OPEN = {
  frames: [0.15, 0.4, 0.7, 1],
  /** 1 コマの長さ (ms) */
  frameMs: 60,
  /** 閉じるときの 1 コマ (出るほうを短く) */
  closeFrameMs: 45,
} as const;

/** Start メニューの位置に出るログ (sky_shader.log, framerate.log)。単位は ms */
export const SYSTEM_LOG = {
  /** 各行が出る間隔 */
  lineStaggerMs: 140,
  /** 1 行の文字がほどけて確定するまで */
  decodeMs: 220,
  /** 結果の行が出てから残す時間 */
  holdMs: 900,
  /** 消える時間 */
  fadeMs: 200,
} as const;
