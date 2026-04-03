"use client";

import { type ReactNode } from "react";
import {
  WindowManagerProvider,
  useWindowManager,
} from "@/app/contexts/WindowManager";
import RetroWindow from "@/app/components/RetroWindow";
import Taskbar from "@/app/components/Taskbar";
import { useIsMobile } from "@/app/hooks/useIsMobile";
import {
  WINDOW_REGISTRY,
  type WindowId,
} from "@/app/config/windowRegistry";

type Props = {
  /** 各ウィンドウの中身を WindowId → ReactNode で渡す */
  contents: Partial<Record<WindowId, ReactNode>>;
};

function DesktopInner({ contents }: Props) {
  const { windows, closeWindow, focusWindow } = useWindowManager();
  const isMobile = useIsMobile();

  return (
    <>
      <main
        className={
          isMobile
            ? "flex flex-col items-center gap-6 p-6 pb-14"
            : "h-[calc(100dvh-2.5rem)] relative overflow-hidden"
        }
      >
        {WINDOW_REGISTRY.map((def) => {
          if (!windows[def.id].open) return null;
          const content = contents[def.id];
          if (!content) return null;

          return (
            <RetroWindow
              key={def.id}
              title={def.title}
              color={def.color}
              className={
                isMobile
                  ? def.mobileClassName
                  : def.desktopClassName
              }
              draggable={!isMobile}
              initialPosition={!isMobile ? def.initialPosition : undefined}
              zIndex={!isMobile ? windows[def.id].zIndex : undefined}
              onClose={() => closeWindow(def.id)}
              onFocus={() => focusWindow(def.id)}
            >
              {content}
            </RetroWindow>
          );
        })}
      </main>
      <Taskbar />
    </>
  );
}

export default function Desktop(props: Props) {
  return (
    <WindowManagerProvider>
      <DesktopInner {...props} />
    </WindowManagerProvider>
  );
}
