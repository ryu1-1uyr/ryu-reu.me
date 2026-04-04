"use client";

import { useRef, useCallback, useState, type PointerEvent } from "react";

type TitleBarColor = "pink" | "blue" | "teal" | "orange";

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
};

const BAR_COLORS: Record<
  TitleBarColor,
  { light: string; dark: string; deep: string }
> = {
  pink: { light: "#eebbc3", dark: "#ff69b4", deep: "#fb379f" },
  blue: { light: "#232946", dark: "#4a6fa5", deep: "#1e2a78" },
  teal: { light: "#2a9d8f", dark: "#40c9a2", deep: "#1e776f" },
  orange: { light: "#f2c57c", dark: "#e09f3e", deep: "#d17c2a" },
};

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
}: Props) {
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

  const style: React.CSSProperties = draggable
    ? {
        position: "absolute",
        left: pos.x,
        top: pos.y,
        zIndex: zIndex ?? "auto",
      }
    : {};

  return (
    <div
      className={`
        rounded-lg
        border-2 border-illustration-stroke
        shadow-[4px_4px_0px_0px_rgba(18,22,41,0.6)]
        w-fit
        ${className}
      `}
      style={style}
      onPointerDown={() => onFocus?.()}
    >
      {/* タイトルバー */}
      <div
        className={`
          flex items-center justify-between
          px-3 py-1.5
          border-b-2 border-illustration-stroke
          ${draggable ? "cursor-grab active:cursor-grabbing select-none" : ""}
        `}
        style={{
          background: `linear-gradient(to right, ${BAR_COLORS[color].dark}, ${BAR_COLORS[color].light})`,
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        <span className="text-xs font-bold text-elements-background tracking-wider truncate">
          {title}
        </span>
        <div className="flex items-center gap-1.5 shrink-0 ml-2">
          <span className="w-3 h-3 rounded-sm border border-elements-background/40 bg-elements-background/20 flex items-center justify-center text-[8px] leading-none text-elements-background/70">
            ─
          </span>
          <span className="w-3 h-3 rounded-sm border border-elements-background/40 bg-elements-background/20 flex items-center justify-center text-[8px] leading-none text-elements-background/70">
            □
          </span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onClose?.();
            }}
            className="w-3 h-3 rounded-sm border border-elements-background/40 flex items-center justify-center text-[8px] leading-none text-elements-background transition-colors"
            style={{ backgroundColor: BAR_COLORS[color].dark }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = BAR_COLORS[color].deep;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = BAR_COLORS[color].dark;
            }}
          >
            ✕
          </button>
        </div>
      </div>

      {/* コンテンツ */}
      <div className="bg-elements-background/90 backdrop-blur-sm">
        {children}
      </div>
    </div>
  );
}
