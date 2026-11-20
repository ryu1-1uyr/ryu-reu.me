"use client";

import { useEffect, useState, type ReactNode } from "react";
import {
  WindowManagerProvider,
  useWindowManager,
} from "@/app/contexts/WindowManager";
import { SurfaceRegistryProvider } from "@/app/contexts/SurfaceRegistry";
import { WeatherFxBusProvider } from "@/app/contexts/WeatherFxBus";
import { UmbrellaProvider, useUmbrella } from "@/app/contexts/Umbrella";
import UmbrellaCursor from "@/app/components/Umbrella/UmbrellaCursor";
import RetroWindow from "@/app/components/RetroWindow";
import Taskbar from "@/app/components/Taskbar";
import WeatherFxOverlay from "@/app/components/WeatherFxOverlay/WeatherFxOverlay";
import Resident from "@/app/components/Resident/Resident";
import { pinkSkin, blueSkin } from "@/app/components/Resident/skins/placeholderSkin";
import { useIsMobile } from "@/app/hooks/useIsMobile";
import CrtOverlay, { CrtTuner } from "@/app/components/CrtOverlay";
import {
  WINDOW_REGISTRY,
  type WindowId,
} from "@/app/config/windowRegistry";

// 起動シーケンスを構成する CSS アニメーション名 (globals.css)
const BOOT_ANIMATIONS = new Set([
  "boot-camera",
  "boot-taskbar",
  "boot-power",
  "zoom-rect",
  "window-unfold",
  "title-type",
  "body-rise",
]);

/** 起動シーケンスの最大の長さ。これを過ぎたらスキップの待ち受けをやめる */
const BOOT_SKIP_WINDOW_MS = 3000;

/** 起動中にクリック・キー・スクロールが来たら、演出を最後まで飛ばして操作を優先する */
function useBootSkip() {
  useEffect(() => {
    const skip = () => {
      for (const a of document.getAnimations()) {
        if (a instanceof CSSAnimation && BOOT_ANIMATIONS.has(a.animationName)) {
          a.finish();
        }
      }
      stop();
    };
    const events = ["pointerdown", "keydown", "wheel", "touchstart"] as const;
    const stop = () => {
      events.forEach((e) => window.removeEventListener(e, skip, true));
      clearTimeout(timer);
    };
    events.forEach((e) =>
      window.addEventListener(e, skip, { capture: true, passive: true })
    );
    const timer = setTimeout(stop, BOOT_SKIP_WINDOW_MS);
    return stop;
  }, []);
}

type Props = {
  /** 各ウィンドウの中身を WindowId → ReactNode で渡す */
  contents: Partial<Record<WindowId, ReactNode>>;
};

function DesktopInner({ contents }: Props) {
  const { windows, closeWindow, focusWindow } = useWindowManager();
  const isMobile = useIsMobile();
  const umbrella = useUmbrella();
  // 起動演出の対象 = Desktop の表示時点で開いていたウィンドウ。
  // トップへ来るたびに Desktop が作り直されるので毎回再生される。
  // 後からタスクバーで開いたもの・一度閉じたものは短い出現だけにする
  const [bootIds, setBootIds] = useState(
    () => new Set(WINDOW_REGISTRY.filter((d) => windows[d.id].open).map((d) => d.id))
  );
  let bootIndex = 0;
  useBootSkip();

  return (
    <SurfaceRegistryProvider>
      <WeatherFxBusProvider>
        <main
          className={
            isMobile
              ? "boot-stage crt-screen flex flex-col items-center gap-6 p-6 pb-14"
              : "boot-stage crt-screen h-[calc(100dvh-2.5rem)] relative overflow-hidden"
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
                onClose={() => {
                  closeWindow(def.id);
                  if (bootIds.has(def.id)) {
                    setBootIds((prev) => {
                      const next = new Set(prev);
                      next.delete(def.id);
                      return next;
                    });
                  }
                }}
                onFocus={() => focusWindow(def.id)}
                surfaceId={!isMobile ? def.id : undefined}
                appear={bootIds.has(def.id) ? bootIndex++ : "open"}
                launchFrom={windows[def.id].launchFrom}
              >
                {content}
              </RetroWindow>
            );
          })}
        </main>
        <Taskbar />
        {!isMobile && <WeatherFxOverlay />}
        {!isMobile && <Resident skin={pinkSkin} />}
        {!isMobile && <Resident skin={blueSkin} />}
        {!isMobile && umbrella?.active && <UmbrellaCursor />}
        <CrtOverlay />
        {process.env.NODE_ENV === "development" && <CrtTuner />}
      </WeatherFxBusProvider>
    </SurfaceRegistryProvider>
  );
}

export default function Desktop(props: Props) {
  return (
    <WindowManagerProvider>
      <UmbrellaProvider>
        <DesktopInner {...props} />
      </UmbrellaProvider>
    </WindowManagerProvider>
  );
}
