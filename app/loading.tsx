"use client";

import RetroWindow from "@/app/components/RetroWindow";

export default function Loading() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-elements-background/40 backdrop-blur-sm">
      <RetroWindow title="Loading..." color="teal" className="min-w-[280px]">
        <div className="px-6 py-5 space-y-3">
          <p className="text-sm text-elements-paragraph">読み込み中...</p>
          {/* プログレスバー */}
          <div className="h-2 rounded-full bg-illustration-stroke/20 overflow-hidden">
            <div className="h-full rounded-full bg-elements-button animate-loading-bar" />
          </div>
        </div>
      </RetroWindow>
    </div>
  );
}
