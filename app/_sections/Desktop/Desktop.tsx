"use client";

import { type ReactNode } from "react";
import {
  WindowManagerProvider,
  useWindowManager,
} from "@/app/contexts/WindowManager";
import RetroWindow from "@/app/components/RetroWindow";
import Taskbar from "@/app/components/Taskbar";
import WeatherControl from "@/app/_sections/WeatherControl";
import { useIsMobile } from "@/app/hooks/useIsMobile";

type Props = {
  aboutMe: ReactNode;
  postList: ReactNode;
};

function DesktopInner({ aboutMe, postList }: Props) {
  const { windows, closeWindow, focusWindow } = useWindowManager();
  const isMobile = useIsMobile();

  return (
    <>
      <main className="flex flex-col md:flex-row items-center md:items-end justify-center gap-6 p-6">
        {windows["about-me"].open && (
          <RetroWindow
            title="about_me.txt"
            color="pink"
            className="max-w-md"
            draggable={!isMobile}
            zIndex={windows["about-me"].zIndex}
            onClose={() => closeWindow("about-me")}
            onFocus={() => focusWindow("about-me")}
          >
            {aboutMe}
          </RetroWindow>
        )}
        {windows["recent-posts"].open && (
          <RetroWindow
            title="recent_posts.log"
            color="teal"
            className="max-w-md"
            draggable={!isMobile}
            zIndex={windows["recent-posts"].zIndex}
            onClose={() => closeWindow("recent-posts")}
            onFocus={() => focusWindow("recent-posts")}
          >
            {postList}
          </RetroWindow>
        )}
        {windows["yaogoromo"].open && (
          <RetroWindow
            title="yaogoromo.exe"
            color="orange"
            draggable={!isMobile}
            zIndex={windows["yaogoromo"].zIndex}
            onClose={() => closeWindow("yaogoromo")}
            onFocus={() => focusWindow("yaogoromo")}
          >
            <WeatherControl />
          </RetroWindow>
        )}
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
