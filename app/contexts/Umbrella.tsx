"use client";

import { createContext, useContext, useState, useCallback } from "react";

/**
 * umbrella.exe の起動状態。Start メニューのトグルと
 * 傘カーソルのマウントを繋ぐだけの小さな context。
 */
type UmbrellaContextType = {
  active: boolean;
  toggle: () => void;
};

const UmbrellaContext = createContext<UmbrellaContextType | null>(null);

export function UmbrellaProvider({ children }: { children: React.ReactNode }) {
  const [active, setActive] = useState(false);
  const toggle = useCallback(() => setActive((v) => !v), []);

  return (
    <UmbrellaContext.Provider value={{ active, toggle }}>
      {children}
    </UmbrellaContext.Provider>
  );
}

export function useUmbrella() {
  return useContext(UmbrellaContext);
}
