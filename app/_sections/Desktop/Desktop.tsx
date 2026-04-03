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

// PC 用の初期配置（親コンテナからの absolute 座標）
// 画面を 3 分割くらいのイメージで横に並べる
const INITIAL_POSITIONS = {
  "about-me": { x: 60, y: 40 },
  "recent-posts": { x: 520, y: 60 },
  yaogoromo: { x: 960, y: 80 },
} as const;

function DesktopInner({ aboutMe, postList }: Props) {
  const { windows, closeWindow, focusWindow } = useWindowManager();
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <>
        <main className="flex flex-col items-center gap-6 p-6 pb-14">
          {windows["about-me"].open && (
            <RetroWindow
              title="about_me.txt"
              color="pink"
              className="max-w-md w-full"
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
              className="max-w-md w-full"
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
              className="w-full max-w-xs"
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

  // PC: relative コンテナ + absolute 配置 + ドラッグ可能
  return (
    <>
      <main className="h-[calc(100dvh-2.5rem)] relative overflow-hidden">
        {windows["about-me"].open && (
          <RetroWindow
            title="about_me.txt"
            color="pink"
            className="max-w-md"
            draggable
            initialPosition={INITIAL_POSITIONS["about-me"]}
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
            draggable
            initialPosition={INITIAL_POSITIONS["recent-posts"]}
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
            draggable
            initialPosition={INITIAL_POSITIONS["yaogoromo"]}
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
