"use client";

import { useRouter } from "next/navigation";
import { usePageTransition } from "@/app/components/PageTransition/PageTransitionContext";

export default function BackButton() {
  const router = useRouter();
  const { startExit } = usePageTransition();

  const handleBack = async () => {
    await startExit();
    router.back();
  };

  return (
    <button
      onClick={handleBack}
      className="group inline-flex items-center gap-2 text-elements-paragraph hover:text-elements-button transition-colors duration-200 mb-8 text-sm"
    >
      <span className="inline-block transition-transform duration-200 group-hover:-translate-x-1">
        ←
      </span>
      <span>トップへ戻る</span>
    </button>
  );
}
