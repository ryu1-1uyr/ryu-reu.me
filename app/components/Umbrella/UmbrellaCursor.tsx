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
 * 起動時はドット絵のコマ送りで開き、終了時は逆再生で閉じてから消える。
 */
export default function UmbrellaCursor({ active }: { active: boolean }) {
  // 閉じる演出の間は OFF になっても残し、閉じきったら外す
  const [mounted, setMounted] = useState(active);
  if (active && !mounted) setMounted(true);
  if (!mounted) return null;
  return <Umbrella closing={!active} onClosed={() => setMounted(false)} />;
}

function Umbrella({
  closing,
  onClosed,
}: {
  closing: boolean;
  onClosed: () => void;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const registry = useSurfaceRegistry();
  // コマ送りの位置。reduced motion では最初から全開
  const lastFrame = UMBRELLA_OPEN.frames.length - 1;
  const [reduce] = useState(
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const [frame, setFrame] = useState(reduce ? lastFrame : 0);
  const frameRef = useRef(frame);
  // 最初の pointermove まで画面外にいるので、姿を見せてから開く
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;

    document.documentElement.classList.add("umbrella-mode");
    let moved = false;
    const onMove = (e: PointerEvent) => {
      if (!moved) {
        moved = true;
        setShown(true);
      }
      // カーソルの先がカサの中心あたりに来るように配置する
      el.style.transform = `translate3d(${e.clientX - UMBRELLA_WIDTH / 2}px, ${
        e.clientY - UMBRELLA_HEIGHT * 0.45
      }px, 0)`;
    };
    window.addEventListener("pointermove", onMove, { passive: true });

    return () => {
      window.removeEventListener("pointermove", onMove);
      document.documentElement.classList.remove("umbrella-mode");
    };
  }, []);

  // 開いている間だけ屋根として登録する。閉じ始めたら外し、積もった雪は既存の仕組みで崩れ落ちる
  useEffect(() => {
    const el = rootRef.current;
    if (!el || closing) return;
    registry?.register("umbrella", el);
    return () => registry?.unregister("umbrella");
  }, [registry, closing]);

  // 開く: 今のコマから全開へ。閉じる: 今のコマから閉じた傘へ戻し、1 コマ置いて消す。
  // 途中で反転したら、その位置から逆向きに送る
  useEffect(() => {
    if (!shown) {
      if (closing) onClosed();
      return;
    }
    if (closing && reduce) {
      onClosed();
      return;
    }
    const target = closing ? 0 : lastFrame;
    const stepMs = closing ? UMBRELLA_OPEN.closeFrameMs : UMBRELLA_OPEN.frameMs;
    const from = frameRef.current;
    const dir = Math.sign(target - from);
    const steps = Math.abs(target - from);
    const timers: number[] = [];
    for (let i = 1; i <= steps; i++) {
      const next = from + dir * i;
      timers.push(
        window.setTimeout(() => {
          frameRef.current = next;
          setFrame(next);
        }, i * stepMs),
      );
    }
    if (closing) timers.push(window.setTimeout(onClosed, (steps + 1) * stepMs));
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, [shown, closing, reduce, lastFrame, onClosed]);

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
