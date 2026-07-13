/**
 * 雷の一撃（発雷の瞬間）を発生源から購読者へ伝える軽量イベントバス。
 * SkyCanvas（背景の稲妻描画）が発火し、デスクトップの住人などが購読する。
 * SkyCanvas は WeatherFxBusProvider の外にマウントされるため、
 * React context ではなくモジュールシングルトンで共有する。
 */

type Listener = () => void;

const listeners = new Set<Listener>();

/** 発雷の瞬間に呼ぶ。購読者がいなければ何もしない */
export function emitThunder(): void {
  listeners.forEach((listener) => listener());
}

/** 発雷イベントを購読する。返り値で解除 */
export function onThunder(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
