import type { ReactNode } from "react";

export type WindowId = "about-me" | "recent-posts" | "yaogoromo";

type TitleBarColor = "pink" | "blue" | "teal" | "orange";

export type WindowDef = {
  id: WindowId;
  title: string;
  icon: string;
  color: TitleBarColor;
  /** 初期状態で開いてるか */
  initialOpen: boolean;
  /** PC 時の初期配置 */
  initialPosition: { x: number; y: number };
  /** モバイル時の追加 className */
  mobileClassName?: string;
  /** PC 時の追加 className */
  desktopClassName?: string;
};

/**
 * ウィンドウの定義。新しいウィンドウ追加時はここだけ編集すればOK
 * （+ Desktop に content を渡す部分だけ追加）
 */
export const WINDOW_REGISTRY: WindowDef[] = [
  {
    id: "about-me",
    title: "about_me.txt",
    icon: "👤",
    color: "pink",
    initialOpen: true,
    initialPosition: { x: 60, y: 40 },
    mobileClassName: "max-w-md w-full",
    desktopClassName: "max-w-md",
  },
  {
    id: "recent-posts",
    title: "recent_posts.log",
    icon: "📝",
    color: "teal",
    initialOpen: true,
    initialPosition: { x: 520, y: 60 },
    mobileClassName: "max-w-md w-full",
    desktopClassName: "max-w-md",
  },
  {
    id: "yaogoromo",
    title: "yaogoromo.exe",
    icon: "🌤️",
    color: "orange",
    initialOpen: false,
    initialPosition: { x: 960, y: 80 },
    mobileClassName: "w-full max-w-xs",
  },
];

// ユーティリティ: レジストリから初期状態を生成
export function buildInitialWindows() {
  const windows: Record<string, { open: boolean; zIndex: number }> = {};
  let z = 0;
  for (const def of WINDOW_REGISTRY) {
    if (def.initialOpen) z++;
    windows[def.id] = { open: def.initialOpen, zIndex: def.initialOpen ? z : 0 };
  }
  return windows as Record<WindowId, { open: boolean; zIndex: number }>;
}

// ユーティリティ: レジストリから初期 topZ を計算
export function buildInitialTopZ() {
  return WINDOW_REGISTRY.filter((d) => d.initialOpen).length;
}
