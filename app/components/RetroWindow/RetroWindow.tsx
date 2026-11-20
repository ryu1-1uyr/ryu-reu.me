"use client";

import { useRef, useCallback, useState, useEffect, type PointerEvent } from "react";
import { useSurfaceRegistry } from "@/app/contexts/SurfaceRegistry";
import WindowTitleBar, { type TitleBarColor } from "./WindowTitleBar";
import { playZoomRects, taskbarStartRect } from "./zoomRects";
import { MOTION_DURATION, MOTION_EASE, WINDOW_CLOSE } from "@/app/config/motion";

type Props = {
  title: string;
  color?: TitleBarColor;
  children: React.ReactNode;
  className?: string;
  draggable?: boolean;
  /** draggable 時の初期位置（親コンテナからの absolute 座標） */
  initialPosition?: { x: number; y: number };
  zIndex?: number;
  onClose?: () => void;
  onFocus?: () => void;
  /** 指定すると SurfaceRegistry に登録し天候エフェクトの干渉対象になる */
  surfaceId?: string;
  /**
   * 出現アニメーション。数値なら起動演出 (値はずらしの段数)、
   * "open" なら単体で開くときの短い出現
   */
  appear?: number | "open";
  /**
   * appear="open" のとき、開いた操作の位置 (ビューポート座標)。
   * 指定するとそこからズーム矩形が飛び、起動演出と同じ順で組み上がる
   */
  launchFrom?: { x: number; y: number };
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export default function RetroWindow({
  title,
  color = "pink",
  children,
  className = "",
  draggable = false,
  initialPosition,
  zIndex,
  onClose,
  onFocus,
  surfaceId,
  appear,
  launchFrom,
}: Props) {
  const registry = useSurfaceRegistry();
  const rootRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const closingRef = useRef(false);

  useEffect(() => {
    if (!surfaceId || !registry || !rootRef.current) return;
    const el = rootRef.current;
    registry.register(surfaceId, el);
    return () => registry.unregister(surfaceId);
  }, [surfaceId, registry]);

  // draggable の場合: absolute 配置で initialPosition からスタート
  const [pos, setPos] = useState(initialPosition ?? { x: 0, y: 0 });
  const dragRef = useRef<{
    startX: number;
    startY: number;
    originX: number;
    originY: number;
  } | null>(null);

  const handlePointerDown = useCallback(
    (e: PointerEvent<HTMLDivElement>) => {
      if (!draggable) return;
      onFocus?.();

      dragRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        originX: pos.x,
        originY: pos.y,
      };
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    },
    [draggable, pos, onFocus]
  );

  const handlePointerMove = useCallback((e: PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    setPos({
      x: dragRef.current.originX + dx,
      y: dragRef.current.originY + dy,
    });
  }, []);

  const handlePointerUp = useCallback(() => {
    dragRef.current = null;
  }, []);

  // 閉じる (最小化): 本体をタイトルバーまで畳み、帯をタスクバーの Start へ飛ばしてから閉じる
  const handleClose = async () => {
    if (!onClose) return;
    const root = rootRef.current;
    const frame = frameRef.current;
    if (!root || !frame || closingRef.current) return;
    closingRef.current = true;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      await root.animate([{ opacity: 1 }, { opacity: 0 }], {
        duration: MOTION_DURATION.reduced * 1000,
        fill: "forwards",
      }).finished;
      onClose();
      return;
    }

    const bar = frame.querySelector<HTMLElement>(".window-titlebar");
    const barH = bar?.offsetHeight ?? 32;
    const fold = frame.animate(
      [
        { clipPath: "inset(0px 0px 0px 0px round 0.5rem)" },
        { clipPath: `inset(0px 0px calc(100% - ${barH}px) 0px round 0.5rem)` },
      ],
      {
        duration: WINDOW_CLOSE.fold * 1000,
        easing: `cubic-bezier(${MOTION_EASE.exit.join(",")})`,
        fill: "forwards",
      }
    );
    await sleep((WINDOW_CLOSE.fold - WINDOW_CLOSE.zoomOverlap) * 1000);
    if (bar) {
      const r = bar.getBoundingClientRect();
      playZoomRects(
        { x: r.x, y: r.y, width: r.width, height: r.height },
        taskbarStartRect()
      );
    }
    await fold.finished;
    root.style.visibility = "hidden";
    onClose();
  };

  // 起動演出、またはスタートメニューから開いたときは「組み上がる」演出にする
  const assemble = typeof appear === "number" || (appear === "open" && !!launchFrom);

  const style: React.CSSProperties = {
    ...(draggable
      ? {
          position: "absolute",
          left: pos.x,
          top: pos.y,
          zIndex: zIndex ?? "auto",
        }
      : {}),
    ...(typeof appear === "number"
      ? ({
          "--boot-index": String(appear),
          // ズーム矩形の出どころ = タスクバーの Start ボタン。
          // 親 (main) の高さは 100dvh - 2.5rem なので、Start の中心は 100dvh - 1.25rem
          ...(draggable
            ? {
                "--zoom-from": `translate(calc(40px - ${pos.x}px), calc(100dvh - 1.25rem - ${pos.y}px)) scale(0.06)`,
              }
            : {}),
        } as React.CSSProperties)
      : {}),
    ...(appear === "open" && launchFrom
      ? ({
          // 待ち時間なしで、押したメニュー項目から飛ばす
          // (モバイルは配置が流れで決まるので出どころは CSS の既定 = 足元)
          "--boot-t": "0ms",
          ...(draggable
            ? {
                "--zoom-from": `translate(${launchFrom.x - pos.x}px, ${launchFrom.y - pos.y}px) scale(0.1)`,
              }
            : {}),
        } as React.CSSProperties)
      : {}),
  };

  const appearClass =
    appear === undefined
      ? ""
      : assemble
        ? "window-appear-boot"
        : "window-appear-open";

  // 外枠 = 位置と演出 (ズーム矩形の残像は ::before / ::after)。
  // 中身 = 見た目。overflow-hidden が残像を切らないよう 2 層に分けている
  return (
    <div
      ref={rootRef}
      className={`relative w-fit ${appearClass} ${className}`}
      style={style}
      onPointerDown={() => onFocus?.()}
    >
      <div
        ref={frameRef}
        className="
          window-frame
          rounded-lg
          border-2 border-illustration-stroke
          overflow-hidden
          shadow-[4px_4px_0px_0px_rgba(18,22,41,0.6)]
        "
      >
        <WindowTitleBar
          title={title}
          color={color}
          onClose={handleClose}
          className={draggable ? "cursor-grab active:cursor-grabbing select-none" : ""}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
        />

        {/* コンテンツ */}
        <div className="window-body bg-elements-background/90 backdrop-blur-sm">
          {children}
        </div>
      </div>
    </div>
  );
}
