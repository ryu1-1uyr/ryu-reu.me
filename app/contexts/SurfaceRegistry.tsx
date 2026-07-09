"use client";

import { createContext, useContext, useCallback, useRef } from "react";

type SurfaceRegistryContextType = {
  register: (id: string, element: HTMLElement) => void;
  unregister: (id: string) => void;
  getSurfaces: () => Map<string, HTMLElement>;
};

const SurfaceRegistryContext =
  createContext<SurfaceRegistryContextType | null>(null);

export function SurfaceRegistryProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const surfacesRef = useRef(new Map<string, HTMLElement>());

  const register = useCallback((id: string, element: HTMLElement) => {
    surfacesRef.current.set(id, element);
  }, []);

  const unregister = useCallback((id: string) => {
    surfacesRef.current.delete(id);
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
