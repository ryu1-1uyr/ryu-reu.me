"use client";

import { useEffect } from "react";
import { clearNavOrigin, recordNavOrigin } from "./navOrigin";

/**
 * 内部リンクを押したときの矩形を記録する。描画はしない。
 * リンク以外の押下 (戻るボタン等) やブラウザの戻る/進むでは記録を捨て、
 * 無関係な場所を支点に開かないようにする
 */
export default function NavOriginTracker() {
  useEffect(() => {
    const handlePointerDown = (e: PointerEvent) => {
      const anchor = (e.target as Element | null)?.closest?.("a[href^='/']");
      if (!anchor) {
        clearNavOrigin();
        return;
      }
      // カードの中のリンクならカード全体を出どころにする
      const r = (anchor.closest("article") ?? anchor).getBoundingClientRect();
      recordNavOrigin({ x: r.x, y: r.y, width: r.width, height: r.height });
    };
    document.addEventListener("pointerdown", handlePointerDown, true);
    window.addEventListener("popstate", clearNavOrigin);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown, true);
      window.removeEventListener("popstate", clearNavOrigin);
    };
  }, []);

  return null;
}
