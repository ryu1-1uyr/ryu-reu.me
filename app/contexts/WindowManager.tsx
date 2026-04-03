"use client";

import { createContext, useContext, useState, useCallback } from "react";

export type WindowId = "about-me" | "recent-posts" | "yaogoromo";

type WindowState = {
  open: boolean;
  zIndex: number;
};

type WindowManagerContextType = {
  windows: Record<WindowId, WindowState>;
  closeWindow: (id: WindowId) => void;
  openWindow: (id: WindowId) => void;
  focusWindow: (id: WindowId) => void;
  topZ: number;
};

const INITIAL_WINDOWS: Record<WindowId, WindowState> = {
  "about-me": { open: true, zIndex: 1 },
  "recent-posts": { open: true, zIndex: 2 },
  yaogoromo: { open: false, zIndex: 0 },
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
    useState<Record<WindowId, WindowState>>(INITIAL_WINDOWS);
  const [topZ, setTopZ] = useState(2);

  const closeWindow = useCallback((id: WindowId) => {
    setWindows((prev) => ({
      ...prev,
      [id]: { ...prev[id], open: false },
    }));
  }, []);

  const openWindow = useCallback(
    (id: WindowId) => {
      const newZ = topZ + 1;
      setTopZ(newZ);
      setWindows((prev) => ({
        ...prev,
        [id]: { open: true, zIndex: newZ },
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
      value={{ windows, closeWindow, openWindow, focusWindow, topZ }}
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
