/**
 * 雨の影: サーフェス（ウィンドウ・タスクバー）に雨が当たるなら、
 * その真下には雨・雪は届かない。背景キャンバスのパーティクルを
 * 「サーフェス上辺より下 かつ x 範囲内」の領域で描画スキップするための判定。
 * 領域は画面下端まで伸びる（屋根に遮られた雨がその下で再出現しないように）。
 */

export type ShadowRect = {
  /** サーフェス左端 */
  x: number;
  /** サーフェス上辺（この y より下が影） */
  y: number;
  width: number;
};

export function isShadowed(
  x: number,
  y: number,
  shadows: ShadowRect[],
): boolean {
  for (const s of shadows) {
    if (y >= s.y && x >= s.x && x <= s.x + s.width) return true;
  }
  return false;
}
