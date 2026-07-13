/**
 * 住人の見た目の中間表現（ポーズ）。
 * エンジン状態 + 環境入力 + 時刻から純関数で導出し、Skin がこれだけを見て描画する。
 * スプライトシート差し替え時は key / frame を行・コマ選択に使う想定。
 */

import type { ResidentEnv, ResidentState, ResidentStateName } from "./residentEngine";

export type ResidentEmote = "none" | "zzz" | "surprise" | "teleport";

export type ResidentPose = {
  key: ResidentStateName;
  /** 歩行アニメ等のコマ番号（DOM skin では未使用でも良い） */
  frame: number;
  /** 歩行ボブの y オフセット (px, 上方向が負) */
  bobY: number;
  /** 縦スケール（着地スカッシュ / 落下ストレッチ） */
  squashY: number;
  /** 風よろけの傾き (deg, ワールド座標系) */
  tilt: number;
  eyesClosed: boolean;
  /** 雨宿り中の屈みポーズ */
  crouch: boolean;
  emote: ResidentEmote;
  /** 頭の積雪量 0-1 */
  headSnow: number;
  /** 全体スケール（テレポート演出用） */
  scale: number;
};

const BLINK_INTERVAL = 3400; // ms
const BLINK_DURATION = 120; // ms
const WALK_FRAME_MS = 120;
const WALK_FRAME_COUNT = 4;
/** この実効風以上でよろけ始める */
export const TILT_WIND_THRESHOLD = 0.8;

export function computePose(
  state: ResidentState,
  env: ResidentEnv,
  timeMs: number,
): ResidentPose {
  let bobY = 0;
  let squashY = 1;
  let frame = 0;

  if (state.name === "walk" || state.name === "shelterSeek") {
    bobY = Math.abs(Math.sin(state.stateTime / 90)) * -1.5;
    frame = Math.floor(state.stateTime / WALK_FRAME_MS) % WALK_FRAME_COUNT;
  } else if (state.name === "land") {
    const t = Math.min(state.stateTime / state.stateDuration, 1);
    squashY = 0.72 + 0.28 * t;
  } else if (state.name === "fall" || state.name === "startle") {
    squashY = 1.12;
  }

  const tilt =
    Math.abs(env.wind) >= TILT_WIND_THRESHOLD ? env.wind * 8 : 0;

  let emote: ResidentEmote = "none";
  if (state.name === "sleep") emote = "zzz";
  else if (state.name === "startle") emote = "surprise";
  else if (state.name === "teleportOut" || state.name === "teleportIn")
    emote = "teleport";

  // テレポート演出: 縮んで消え、行き先で膨らんで現れる
  let scale = 1;
  if (state.name === "teleportOut") {
    scale = Math.max(0, 1 - state.stateTime / state.stateDuration);
  } else if (state.name === "teleportIn") {
    scale = Math.min(1, state.stateTime / state.stateDuration);
  }

  return {
    key: state.name,
    frame,
    bobY,
    squashY,
    tilt,
    eyesClosed:
      state.name === "sleep" || timeMs % BLINK_INTERVAL < BLINK_DURATION,
    crouch: state.name === "shelter",
    emote,
    headSnow: state.headSnow,
    scale,
  };
}
