"use client";

import type { PointerEventHandler } from "react";

export type TitleBarColor = "pink" | "blue" | "teal" | "orange";

export const BAR_COLORS: Record<
  TitleBarColor,
  { light: string; dark: string; deep: string }
> = {
  pink: { light: "#eebbc3", dark: "#ff69b4", deep: "#fb379f" },
  blue: { light: "#232946", dark: "#4a6fa5", deep: "#1e2a78" },
  teal: { light: "#2a9d8f", dark: "#40c9a2", deep: "#1e776f" },
  orange: { light: "#f2c57c", dark: "#e09f3e", deep: "#d17c2a" },
};

type Props = {
  title: string;
  color: TitleBarColor;
  onClose?: () => void;
  className?: string;
  onPointerDown?: PointerEventHandler<HTMLDivElement>;
  onPointerMove?: PointerEventHandler<HTMLDivElement>;
  onPointerUp?: PointerEventHandler<HTMLDivElement>;
};

/**
 * レトロ OS 風のタイトルバー。
 * window-titlebar / window-title クラスは起動・遷移演出のフック (globals.css)
 */
export default function WindowTitleBar({
  title,
  color,
  onClose,
  className = "",
  onPointerDown,
  onPointerMove,
  onPointerUp,
}: Props) {
  return (
    <div
      className={`
        window-titlebar
        relative
        flex items-center justify-between
        px-3 py-1.5
        border-b-2 border-illustration-stroke
        ${className}
      `}
      style={
        {
          background: `linear-gradient(to right, ${BAR_COLORS[color].dark}, ${BAR_COLORS[color].light})`,
          "--title-len": String(Math.max(1, [...title].length)),
        } as React.CSSProperties
      }
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
    >
      <span className="window-title text-xs font-bold text-elements-background tracking-wider truncate">
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
          aria-label="閉じる"
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
  );
}
