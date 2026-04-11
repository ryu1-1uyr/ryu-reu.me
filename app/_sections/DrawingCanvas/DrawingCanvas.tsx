"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { useSkyDrawings } from "@/app/contexts/SkyDrawings";
import styles from "./DrawingCanvas.module.css";

type Tool = "pen" | "eraser";

const CANVAS_W = 320;
const CANVAS_H = 240;

// ---- ペンカラーパレット（調整しやすいように分離） ----
// サイトのカラーパレット準拠。夜空でも見えるよう明るめの色を中心に選定。
const PEN_COLORS = [
  { label: "ネイビー", value: "#232946" }, // elements-background（昼向き）
  { label: "ホワイト", value: "#fffffe" }, // elements-headline（夜空に映える）
  { label: "ラベンダー", value: "#b8c1ec" }, // elements-paragraph
  { label: "ピンク", value: "#eebbc3" }, // elements-button / illustration-highlight
  { label: "ゴールド", value: "#f2c57c" }, // illustration-tertiary
  { label: "ティール", value: "#40c9a2" }, // BAR_COLORS teal.dark
] as const;

type PenColor = (typeof PEN_COLORS)[number]["value"];

const FLY_ANIMATIONS = [
  styles.flyToSkyStraight,
  styles.flyToSkyLeft,
  styles.flyToSkyRight,
] as const;

function pickFlyAnimation() {
  return FLY_ANIMATIONS[Math.floor(Math.random() * FLY_ANIMATIONS.length)];
}

export default function DrawingCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const isDrawing = useRef(false);
  const lastPos = useRef<{ x: number; y: number } | null>(null);
  const fadeRafRef = useRef<number | null>(null);

  const [tool, setTool] = useState<Tool>("pen");
  const [penColor, setPenColor] = useState<PenColor>("#fffffe"); // デフォルトはホワイト（夜空でも見える）
  const [flyingImage, setFlyingImage] = useState<string | null>(null);
  const [flyAnimation, setFlyAnimation] = useState<string>("");
  const { addDrawing } = useSkyDrawings();

  // context をキャッシュ & アンマウント時にフェードRAFをキャンセル
  useEffect(() => {
    if (canvasRef.current) {
      ctxRef.current = canvasRef.current.getContext("2d");
    }
    return () => {
      if (fadeRafRef.current) {
        cancelAnimationFrame(fadeRafRef.current);
        fadeRafRef.current = null;
      }
    };
  }, []);

  const getPos = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * CANVAS_W,
      y: ((e.clientY - rect.top) / rect.height) * CANVAS_H,
    };
  }, []);

  // rAF で canvas をじわっとフェードアウトしてクリア
  const startFadeOut = useCallback(() => {
    const ctx = ctxRef.current;
    if (!ctx) return;

    if (fadeRafRef.current) cancelAnimationFrame(fadeRafRef.current);

    const fadeDurationMs = 2000;
    let fadeStartTime: number | null = null;
    let prevTime: number | null = null;

    const fade = (now: number) => {
      if (fadeStartTime === null) fadeStartTime = now;
      if (prevTime === null) prevTime = now;

      const deltaMs = Math.min(now - prevTime, 100);
      const dt = deltaMs / (1000 / 60); // 60fps 基準の比率
      prevTime = now;

      ctx.globalCompositeOperation = "destination-out";
      // 60fps で 0.05 ずつ消す挙動を dt で補正
      const alpha = 1 - Math.pow(1 - 0.05, dt);
      ctx.fillStyle = `rgba(0, 0, 0, ${alpha})`;
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
      ctx.globalCompositeOperation = "source-over";

      if (now - fadeStartTime < fadeDurationMs) {
        fadeRafRef.current = requestAnimationFrame(fade);
      } else {
        // 確実に完全クリア
        ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
        fadeRafRef.current = null;
      }
    };

    fadeRafRef.current = requestAnimationFrame(fade);
  }, []);

  const stopFade = useCallback(() => {
    if (fadeRafRef.current) {
      cancelAnimationFrame(fadeRafRef.current);
      fadeRafRef.current = null;
    }
  }, []);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      // フェード中に描き始めたら残像ごとクリアして白紙に
      if (fadeRafRef.current) {
        stopFade();
        ctxRef.current?.clearRect(0, 0, CANVAS_W, CANVAS_H);
      }
      canvas.setPointerCapture(e.pointerId);
      isDrawing.current = true;
      lastPos.current = getPos(e);
    },
    [getPos, stopFade]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (!isDrawing.current || !lastPos.current) return;
      const ctx = ctxRef.current;
      if (!ctx) return;

      const pos = getPos(e);

      ctx.beginPath();
      ctx.moveTo(lastPos.current.x, lastPos.current.y);
      ctx.lineTo(pos.x, pos.y);

      if (tool === "pen") {
        ctx.globalCompositeOperation = "source-over";
        ctx.strokeStyle = penColor;
        ctx.lineWidth = 3;
      } else {
        ctx.globalCompositeOperation = "destination-out";
        ctx.lineWidth = 20;
      }

      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.stroke();

      ctx.globalCompositeOperation = "source-over";
      lastPos.current = pos;
    },
    [tool, penColor, getPos]
  );

  const handlePointerUp = useCallback(() => {
    isDrawing.current = false;
    lastPos.current = null;
  }, []);

  const handleClear = useCallback(() => {
    stopFade();
    ctxRef.current?.clearRect(0, 0, CANVAS_W, CANVAS_H);
  }, [stopFade]);

  const handleFly = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = ctxRef.current;
    if (!ctx) return;
    const pixels = ctx.getImageData(0, 0, CANVAS_W, CANVAS_H).data;
    const hasContent = pixels.some((_, i) => i % 4 === 3 && pixels[i] > 0);
    if (!hasContent) return;

    const dataURL = canvas.toDataURL("image/png");
    const drawingData = {
      id: crypto.randomUUID(),
      dataURL,
      width: CANVAS_W,
      height: CANVAS_H,
    };

    const anim = pickFlyAnimation();
    setFlyAnimation(anim);
    setFlyingImage(dataURL);

    // canvas はじわっとフェードアウト
    startFadeOut();

    // アニメ終了後に空に追加 + オーバーレイ除去
    setTimeout(() => {
      addDrawing(drawingData);
      setFlyingImage(null);
      setFlyAnimation("");
    }, 2500);
  }, [addDrawing, startFadeOut]);

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

      {/* カラーパレット（ペン選択中のみ表示） */}
      {tool === "pen" && (
        <div className="flex items-center gap-1.5">
          {PEN_COLORS.map((c) => (
            <button
              key={c.value}
              type="button"
              title={c.label}
              onClick={() => setPenColor(c.value)}
              className="w-5 h-5 rounded-full border-2 transition-transform hover:scale-110"
              style={{
                backgroundColor: c.value,
                borderColor:
                  penColor === c.value ? "#fffffe" : "rgba(18,22,41,0.4)",
                boxShadow:
                  penColor === c.value ? `0 0 0 1px #121629` : undefined,
              }}
            />
          ))}
        </div>
      )}

      {/* キャンバス */}
      <div className="relative">
        <canvas
          ref={canvasRef}
          width={CANVAS_W}
          height={CANVAS_H}
          className="w-full rounded border-2 border-illustration-stroke/30 cursor-crosshair"
          style={{
            backgroundColor: "#dfe1ee",
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
          // flyingImage は canvas.toDataURL() で生成された data:image/png;base64,... な URL で、Next.js の <Image> は data: スキームを受け付けない（最適化のために静的パス or 設定済みリモートドメインが必要）
          // 無理やり使おうとするとランタイムエラーになる。
          // SkyCanvas 側の <img> (OgCard 含む) も Satori 内部 or Canvas API 経由なのでブラウザ標準の img で正しい。
          // eslint-disable-next-line @next/next/no-img-element
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
