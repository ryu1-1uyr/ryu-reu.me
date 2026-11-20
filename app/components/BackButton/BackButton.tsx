"use client";

import { useBackNavigation } from "@/app/components/PageTransition";

export default function BackButton() {
  const handleBack = useBackNavigation();

  return (
    <button
      onClick={handleBack}
      className="group inline-flex items-center gap-2 text-elements-paragraph hover:text-elements-button transition-colors duration-200 mb-8 text-sm"
    >
      <span className="inline-block transition-transform duration-200 group-hover:-translate-x-1">
        ←
      </span>
      <span>戻る</span>
    </button>
  );
}
