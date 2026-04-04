"use client";

import { useRef, useState, useCallback } from "react";
import { useSkyDrawings } from "@/app/contexts/SkyDrawings";

type Tool = "pen" | "eraser";

const CANVAS_W = 320;
const CANVAS_H = 240;

// Tailwind のパージ対策で完全なクラス名を列挙する
const FLY_ANIMATIONS = [
  "animate-fly-to-sky-straight",
  "animate-fly-to-sky-left",
  "animate-fly-to-sky-right",
] as const;

function pickFlyAnimation() {
  return FLY_ANIMATIONS[Math.floor(Math.random() * FLY_ANIMATIONS.length)];
}

export default function DrawingCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawing = useRef(false);
  const lastPos = useRef<{ x: number; y: number } | null>(null);

  const [tool, setTool] = useState<Tool>("pen");
  const [flyingImage, setFlyingImage] = useState<string | null>(null);
  const [flyAnimation, setFlyAnimation] = useState<string>("");
  const { addDrawing } = useSkyDrawings();

  const getPos = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * CANVAS_W,
      y: ((e.clientY - rect.top) / rect.height) * CANVAS_H,
    };
  }, []);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.setPointerCapture(e.pointerId);
      isDrawing.current = true;
      lastPos.current = getPos(e);
    },
    [getPos]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (!isDrawing.current || !lastPos.current) return;
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (!canvas || !ctx) return;

      const pos = getPos(e);

      ctx.beginPath();
      ctx.moveTo(lastPos.current.x, lastPos.current.y);
      ctx.lineTo(pos.x, pos.y);

      if (tool === "pen") {
        ctx.globalCompositeOperation = "source-over";
        ctx.strokeStyle = "#232946";
        ctx.lineWidth = 3;
      } else {
        ctx.globalCompositeOperation = "destination-out";
        ctx.lineWidth = 20;
      }

      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.stroke();

      // composite を戻す
      ctx.globalCompositeOperation = "source-over";
      lastPos.current = pos;
    },
    [tool, getPos]
  );

  const handlePointerUp = useCallback(() => {
    isDrawing.current = false;
    lastPos.current = null;
  }, []);

  const handleClear = useCallback(() => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
  }, []);

  const handleFly = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // 何も描かれてなかったら無視
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const pixels = ctx.getImageData(0, 0, CANVAS_W, CANVAS_H).data;
    const hasContent = pixels.some((_, i) => i % 4 === 3 && pixels[i] > 0);
    if (!hasContent) return;

    const dataURL = canvas.toDataURL("image/png");

    // ランダムなモーションを選んで飛び立ちアニメ
    const anim = pickFlyAnimation();
    setFlyAnimation(anim);
    setFlyingImage(dataURL);

    // コンテキストに追加（すぐ空に現れる）
    addDrawing({
      id: crypto.randomUUID(),
      dataURL,
      width: CANVAS_W,
      height: CANVAS_H,
    });

    // アニメ後にクリア（最長パターン 2.4s に合わせる）
    setTimeout(() => {
      setFlyingImage(null);
      setFlyAnimation("");
      handleClear();
    }, 2500);
  }, [addDrawing, handleClear]);

  return (
    <div className="flex flex-col gap-3 p-3">
      {/* ツールバー */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setTool("pen")}
          className={`px-2 py-1 text-xs rounded border-2 transition-colors ${
            tool === "pen"
              ? "border-elements-button bg-elements-button text-elements-button-text"
              : "border-illustration-stroke/30 text-elements-paragraph hover:border-elements-button/50"
          }`}
        >
          ✏️ ペン
        </button>
        <button
          type="button"
          onClick={() => setTool("eraser")}
          className={`px-2 py-1 text-xs rounded border-2 transition-colors ${
            tool === "eraser"
              ? "border-elements-button bg-elements-button text-elements-button-text"
              : "border-illustration-stroke/30 text-elements-paragraph hover:border-elements-button/50"
          }`}
        >
          🧹 消しゴム
        </button>

        <div className="flex-1" />

        <button
          type="button"
          onClick={handleClear}
          className="px-2 py-1 text-xs rounded border-2 border-illustration-stroke/30 text-elements-paragraph hover:border-red-400/50 hover:text-red-300 transition-colors"
        >
          クリア
        </button>
      </div>

      {/* キャンバス */}
      <div className="relative">
        <canvas
          ref={canvasRef}
          width={CANVAS_W}
          height={CANVAS_H}
          className="w-full rounded border-2 border-illustration-stroke/30 bg-white cursor-crosshair"
          style={{
            touchAction: "none",
            aspectRatio: `${CANVAS_W}/${CANVAS_H}`,
          }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
        />

        {/* 飛び立ちアニメ */}
        {flyingImage && (
          <img
            src={flyingImage}
            alt=""
            className={`absolute inset-0 w-full h-full rounded pointer-events-none ${flyAnimation}`}
          />
        )}
      </div>

      {/* 飛ばすボタン */}
      <button
        type="button"
        onClick={handleFly}
        disabled={!!flyingImage}
        className="w-full py-2 text-sm rounded-lg border-2 border-elements-button bg-elements-button/20 text-elements-button hover:bg-elements-button/30 active:bg-elements-button/40 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        ☁️ 空に飛ばす
      </button>
    </div>
  );
}
