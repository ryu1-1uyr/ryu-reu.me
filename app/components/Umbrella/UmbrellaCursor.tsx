"use client";

import { useEffect, useRef } from "react";
import { useSurfaceRegistry } from "@/app/contexts/SurfaceRegistry";
import { setGustSuppressed } from "@/app/components/SkyBackground/gustTracker";

/** 傘の当たり判定ボックスの一辺 (px) */
const UMBRELLA_SIZE = 100;

/**
 * umbrella.exe: カーソルに追従する傘。
 * SurfaceRegistry に登録することで、既存の仕組みがそのまま乗る:
 * - 背景の雨・雪が傘の下に描かれない（雨の影）
 * - 前面の雨粒が傘の上辺で跳ねる（スプラッシュ）・雪が積もる
 * - 住人の雨宿り判定で「屋根」として扱われる（傘をかざすと入ってくる）
 * 表示中はポインタ連動の突風とシステムカーソルを止める。
 */
export default function UmbrellaCursor() {
  const rootRef = useRef<HTMLDivElement>(null);
  const registry = useSurfaceRegistry();

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;

    registry?.register("umbrella", el);
    setGustSuppressed(true);
    document.documentElement.classList.add("umbrella-mode");

    const onMove = (e: PointerEvent) => {
      // カーソルの先がカサの中心あたりに来るように配置する
      el.style.transform = `translate3d(${e.clientX - UMBRELLA_SIZE / 2}px, ${
        e.clientY - UMBRELLA_SIZE * 0.45
      }px, 0)`;
    };
    window.addEventListener("pointermove", onMove, { passive: true });

    return () => {
      window.removeEventListener("pointermove", onMove);
      document.documentElement.classList.remove("umbrella-mode");
      setGustSuppressed(false);
      // 登録解除で積もっていた雪は既存の仕組みで崩れ落ちる
      registry?.unregister("umbrella");
    };
  }, [registry]);

  return (
    <div
      ref={rootRef}
      className="fixed left-0 top-0 z-[70] pointer-events-none select-none flex items-start justify-center text-[88px] leading-none"
      style={{
        width: UMBRELLA_SIZE,
        height: UMBRELLA_SIZE,
        // 最初の pointermove まで画面外に置く
        transform: "translate3d(-200px, -200px, 0)",
      }}
      aria-hidden="true"
    >
      ☂️
    </div>
  );
}
