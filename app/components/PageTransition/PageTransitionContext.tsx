"use client";

import { createContext, useContext } from "react";

type PageTransitionContextType = {
  startExit: () => Promise<void>;
};

export const PageTransitionContext = createContext<PageTransitionContextType>({
  startExit: async () => {},
});

export const usePageTransition = () => useContext(PageTransitionContext);
