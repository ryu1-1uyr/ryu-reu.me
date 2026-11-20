"use client";

import { useRouter } from "next/navigation";
import { usePageTransition } from "./PageTransitionContext";

/** 閉じる演出のあと、同一オリジンの履歴があれば戻り、無ければトップへ行く */
export function useBackNavigation() {
  const router = useRouter();
  const { startExit } = usePageTransition();

  return async () => {
    await startExit();

    const hasSameOriginHistory =
      window.history.length > 1 &&
      document.referrer.startsWith(window.location.origin);

    if (hasSameOriginHistory) {
      router.back();
    } else {
      router.push("/");
    }
  };
}
