"use client";

import { createContext, useContext, useState, useCallback } from "react";
import {
  type WindowId,
  buildInitialWindows,
  buildInitialTopZ,
} from "@/app/config/windowRegistry";

export type { WindowId };

type WindowState = {
  open: boolean;
  zIndex: number;
  /** 開いた操作の位置 (スタートメニューの項目など、ビューポート座標)。開く演出の出どころ */
  launchFrom?: { x: number; y: number };
};

type WindowManagerContextType = {
  windows: Record<WindowId, WindowState>;
  closeWindow: (id: WindowId) => void;
  openWindow: (id: WindowId, launchFrom?: { x: number; y: number }) => void;
  focusWindow: (id: WindowId) => void;
};

const WindowManagerContext = createContext<WindowManagerContextType | null>(
  null
);

export function WindowManagerProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [windows, setWindows] =
    useState<Record<WindowId, WindowState>>(buildInitialWindows);
  const [topZ, setTopZ] = useState(buildInitialTopZ);

  const closeWindow = useCallback((id: WindowId) => {
    setWindows((prev) => ({
      ...prev,
      [id]: { ...prev[id], open: false },
    }));
  }, []);

  const openWindow = useCallback(
    (id: WindowId, launchFrom?: { x: number; y: number }) => {
      const newZ = topZ + 1;
      setTopZ(newZ);
      setWindows((prev) => ({
        ...prev,
        [id]: { open: true, zIndex: newZ, launchFrom },
      }));
    },
    [topZ]
  );

  const focusWindow = useCallback(
    (id: WindowId) => {
      const newZ = topZ + 1;
      setTopZ(newZ);
      setWindows((prev) => ({
        ...prev,
        [id]: { ...prev[id], zIndex: newZ },
      }));
    },
    [topZ]
  );

  return (
    <WindowManagerContext.Provider
      value={{ windows, closeWindow, openWindow, focusWindow }}
    >
      {children}
    </WindowManagerContext.Provider>
  );
}

export function useWindowManager() {
  const ctx = useContext(WindowManagerContext);
  if (!ctx) throw new Error("useWindowManager must be used within provider");
  return ctx;
}
