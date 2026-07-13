"use client";

import { useEffect, useRef } from "react";
import { useSurfaceRegistry } from "@/app/contexts/SurfaceRegistry";
import {
  createResident,
  tick,
  hop,
  type Platform,
  type ResidentState,
} from "./residentEngine";

/** スプライトの一辺 (px)。足元中心座標から左上へ変換するのに使う */
const SIZE = 26;

/**
 * デスクトップの住人（プロトタイプ）。
 * SurfaceRegistry のウィンドウ・タスクバー上辺を足場に歩き回る。
 * 描画は DOM 要素 + transform（将来クリック等のインタラクションを持たせるため）。
 */
export default function Resident() {
  const rootRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const eyesRef = useRef<HTMLDivElement>(null);
  const registry = useSurfaceRegistry();
  const stateRef = useRef<ResidentState | null>(null);

  useEffect(() => {
    const root = rootRef.current;
    const body = bodyRef.current;
    const eyes = eyesRef.current;
    if (!root || !body || !eyes || !registry) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      root.style.display = "none";
      return;
    }

    const viewport = { width: window.innerWidth, height: window.innerHeight };
    const state = createResident(viewport);
    stateRef.current = state;

    let rafId = 0;
    let lastTime = 0;

    function loop(time: number) {
      rafId = requestAnimationFrame(loop);
      const delta = Math.min(lastTime ? time - lastTime : 16.67, 100);
      lastTime = time;

      viewport.width = window.innerWidth;
      viewport.height = window.innerHeight;

      // 足場: 登録サーフェスの上辺 + 画面最下部（保険の地面）
      const platforms: Platform[] = [
        { id: "__ground", x: 0, y: viewport.height, width: viewport.width },
      ];
      registry!.getSurfaces().forEach((el, id) => {
        const r = el.getBoundingClientRect();
        platforms.push({ id, x: r.x, y: r.y, width: r.width });
      });

      tick(state, delta, platforms, viewport);

      // 歩行ボブ・着地スカッシュ・落下ストレッチ
      let bobY = 0;
      let squashY = 1;
      if (state.name === "walk") {
        bobY = Math.abs(Math.sin(state.stateTime / 90)) * -1.5;
      } else if (state.name === "land") {
        const t = Math.min(state.stateTime / state.stateDuration, 1);
        squashY = 0.72 + 0.28 * t;
      } else if (state.name === "fall") {
        squashY = 1.12;
      }

      root!.style.transform = `translate3d(${state.x - SIZE / 2}px, ${
        state.y - SIZE + bobY
      }px, 0)`;
      body!.style.transform = `scaleX(${state.facing}) scaleY(${squashY})`;

      // まばたき（約 3.4 秒周期で 120ms 閉じる）
      eyes!.style.transform = time % 3400 < 120 ? "scaleY(0.15)" : "scaleY(1)";
    }

    rafId = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(rafId);
      stateRef.current = null;
    };
  }, [registry]);

  return (
    <div
      ref={rootRef}
      className="fixed left-0 top-0 z-[55] cursor-pointer select-none will-change-transform"
      style={{ width: SIZE, height: SIZE }}
      onPointerDown={() => {
        if (stateRef.current) hop(stateRef.current);
      }}
      aria-hidden="true"
    >
      <div
        ref={bodyRef}
        className="relative h-full w-full origin-bottom rounded-[9px] border-2 border-illustration-stroke bg-elements-button"
      >
        <div ref={eyesRef} className="absolute inset-0">
          <span className="absolute left-[7px] top-[9px] h-[5px] w-[3px] rounded-full bg-illustration-stroke" />
          <span className="absolute right-[7px] top-[9px] h-[5px] w-[3px] rounded-full bg-illustration-stroke" />
        </div>
      </div>
    </div>
  );
}
