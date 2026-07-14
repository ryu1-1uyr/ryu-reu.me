/**
 * 住人の見た目（Skin）の差し替え用インターフェース。
 * 毎フレーム React 再レンダーを避けるため、mount で DOM を組み立てて
 * apply で命令的に更新する。facing の左右反転は skin 側の責務
 * （スプライトが左右別コマを持つ場合があるため）。
 */

import type { ResidentPose } from "../residentPose";

export type ResidentSkinInstance = {
  apply: (
    pose: ResidentPose,
    facing: 1 | -1,
    /** 住人から見たポインタの相対位置 (px)。視線追従に使う。範囲外なら undefined */
    pointer?: { dx: number; dy: number },
  ) => void;
  unmount: () => void;
};

export type ResidentSkin = {
  /** スプライトの一辺 (px)。足元中心座標から描画原点への変換に使う */
  size: number;
  mount: (root: HTMLElement) => ResidentSkinInstance;
};
