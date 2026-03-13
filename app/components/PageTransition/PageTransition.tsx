"use client";

import { motion, useAnimate } from "framer-motion";
import { ReactNode } from "react";
import { PageTransitionContext } from "./PageTransitionContext";

type Props = {
  children: ReactNode;
};

export default function PageTransition({ children }: Props) {
  const [scope, animate] = useAnimate();

  // 離脱アニメーション: 入場の逆 (easeInQuint)
  const startExit = async () => {
    await animate(
      scope.current,
      { opacity: 0, y: 16, filter: "blur(6px)" },
      { duration: 0.35, ease: [0.55, 0, 0.78, 0] }
    );
  };

  return (
    <PageTransitionContext.Provider value={{ startExit }}>
      <motion.div
        ref={scope}
        initial={{ opacity: 0, y: 20, filter: "blur(6px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        transition={{
          duration: 0.5,
          ease: [0.22, 1, 0.36, 1], // easeOutQuint: 素早く加速して滑らかに減速
        }}
      >
        {children}
      </motion.div>
    </PageTransitionContext.Provider>
  );
}
