"use client";

import { createContext, useContext, useCallback, useRef } from "react";

type SurfaceRegistryContextType = {
  register: (id: string, element: HTMLElement) => void;
  unregister: (id: string) => void;
  getSurfaces: () => Map<string, HTMLElement>;
};

const SurfaceRegistryContext =
  createContext<SurfaceRegistryContextType | null>(null);

// Provider の外にマウントされるモジュール（SkyCanvas の雨の影など）からも
// 登録済みサーフェスを参照できるよう、モジュールレベルにも鏡写しする。
// Provider は Desktop に 1 つだけの前提。
const globalSurfaces = new Map<string, HTMLElement>();

/** Provider 外から登録済みサーフェスを読むための getter（読み取り専用） */
export function getRegisteredSurfaces(): ReadonlyMap<string, HTMLElement> {
  return globalSurfaces;
}

export function SurfaceRegistryProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const surfacesRef = useRef(new Map<string, HTMLElement>());

  const register = useCallback((id: string, element: HTMLElement) => {
    surfacesRef.current.set(id, element);
    globalSurfaces.set(id, element);
  }, []);

  const unregister = useCallback((id: string) => {
    surfacesRef.current.delete(id);
    globalSurfaces.delete(id);
  }, []);

  const getSurfaces = useCallback(() => surfacesRef.current, []);

  return (
    <SurfaceRegistryContext.Provider
      value={{ register, unregister, getSurfaces }}
    >
      {children}
    </SurfaceRegistryContext.Provider>
  );
}

export function useSurfaceRegistry() {
  return useContext(SurfaceRegistryContext);
}
