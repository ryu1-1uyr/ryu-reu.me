"use client";

import { createContext, useContext, useState, useCallback } from "react";

export type SkyDrawing = {
  id: string;
  dataURL: string;
  width: number;
  height: number;
};

type SkyDrawingsContextType = {
  drawings: SkyDrawing[];
  addDrawing: (drawing: SkyDrawing) => void;
};

const SkyDrawingsContext = createContext<SkyDrawingsContextType | null>(null);

export function SkyDrawingsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [drawings, setDrawings] = useState<SkyDrawing[]>([]);

  const addDrawing = useCallback((drawing: SkyDrawing) => {
    setDrawings((prev) => [...prev, drawing]);
  }, []);

  return (
    <SkyDrawingsContext.Provider value={{ drawings, addDrawing }}>
      {children}
    </SkyDrawingsContext.Provider>
  );
}

export function useSkyDrawings() {
  const ctx = useContext(SkyDrawingsContext);
  if (!ctx) throw new Error("useSkyDrawings must be used within provider");
  return ctx;
}
