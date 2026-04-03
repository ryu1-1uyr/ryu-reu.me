import { useSyncExternalStore } from "react";

const getServerSnapshot = () => false;
const getSnapshot = () => {
  return window.matchMedia("(max-width: 768px)").matches;
};
const subscribe = (callback: () => void) => {
  const mediaQuery = window.matchMedia("(max-width: 768px)");
  mediaQuery.addEventListener("change", callback);
  return () => mediaQuery.removeEventListener("change", callback);
};

export function useIsMobile() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
