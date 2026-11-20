"use client";

import { useEffect, useRef, useState } from "react";
import { UMBRELLA_OPEN } from "@/app/config/motion";
import { useSurfaceRegistry } from "@/app/contexts/SurfaceRegistry";
import PixelUmbrella from "./PixelUmbrella";
import { UMBRELLA_COLS, UMBRELLA_ROWS } from "./umbrellaSprite";

/** 1 ドットの大きさ (px)。当たり判定ボックスはスプライトの大きさそのもの */
const DOT = 5;
const UMBRELLA_WIDTH = UMBRELLA_COLS * DOT;
const UMBRELLA_HEIGHT = UMBRELLA_ROWS * DOT;

/**
 * umbrella.exe: カーソルに追従する傘。
 * SurfaceRegistry に登録することで、既存の仕組みがそのまま乗る:
 * - 背景の雨・雪が傘の下に描かれない（雨の影）
 * - 前面の雨粒が傘の上辺で跳ねる（スプラッシュ）・雪が積もる
 * - 住人の雨宿り判定で「屋根」として扱われる（傘をかざすと入ってくる）
 * 表示中はシステムカーソルを止める。
 */
export default function UmbrellaCursor() {
  const rootRef = useRef<HTMLDivElement>(null);
  const registry = useSurfaceRegistry();
  // 開くコマ送りの位置。reduced motion では最初から全開
  const lastFrame = UMBRELLA_OPEN.frames.length - 1;
  const [frame, setFrame] = useState(() =>
    window.matchMedia("(prefers-reduced-motion: reduce)").matches ? lastFrame : 0,
  );
  const frameRef = useRef(frame);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;

    registry?.register("umbrella", el);
    document.documentElement.classList.add("umbrella-mode");

    // 最初の pointermove まで画面外にいるので、姿を見せたときに開く
    const timers: number[] = [];
    let shown = false;
    const openUp = () => {
      for (let i = frameRef.current + 1; i <= lastFrame; i++) {
        const step = i - frameRef.current;
        timers.push(window.setTimeout(() => setFrame(i), step * UMBRELLA_OPEN.frameMs));
      }
    };

    const onMove = (e: PointerEvent) => {
      if (!shown) {
        shown = true;
        openUp();
      }
      // カーソルの先がカサの中心あたりに来るように配置する
      el.style.transform = `translate3d(${e.clientX - UMBRELLA_WIDTH / 2}px, ${
        e.clientY - UMBRELLA_HEIGHT * 0.45
      }px, 0)`;
    };
    window.addEventListener("pointermove", onMove, { passive: true });

    return () => {
      timers.forEach((t) => window.clearTimeout(t));
      window.removeEventListener("pointermove", onMove);
      document.documentElement.classList.remove("umbrella-mode");
      // 登録解除で積もっていた雪は既存の仕組みで崩れ落ちる
      registry?.unregister("umbrella");
    };
  }, [registry, lastFrame]);

  return (
    <div
      ref={rootRef}
      className="fixed left-0 top-0 z-[70] pointer-events-none select-none"
      style={{
        width: UMBRELLA_WIDTH,
        height: UMBRELLA_HEIGHT,
        // 最初の pointermove まで画面外に置く
        transform: "translate3d(-200px, -200px, 0)",
      }}
      aria-hidden="true"
    >
      <PixelUmbrella dot={DOT} open={UMBRELLA_OPEN.frames[frame]} />
    </div>
  );
}
