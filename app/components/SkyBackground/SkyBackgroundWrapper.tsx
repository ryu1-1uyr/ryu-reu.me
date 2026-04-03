"use client";

import dynamic from "next/dynamic";

const SkyBackground = dynamic(() => import("@/app/components/SkyBackground"), {
  ssr: false,
});

export function SkyBackgroundWrapper() {
  return <SkyBackground />;
}
