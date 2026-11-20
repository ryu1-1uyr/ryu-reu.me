"use client";

import { ReactNode, useEffect, useRef } from "react";
import { PageTransitionContext } from "./PageTransitionContext";
import { getNavOrigin } from "@/app/components/NavOriginTracker";
import {
  WindowTitleBar,
  playZoomRects,
  taskbarStartRect,
  viewportRect,
  type TitleBarColor,
} from "@/app/components/RetroWindow";
import { useBackNavigation } from "./useBackNavigation";
import {
  MOTION_DURATION,
  MOTION_EASE,
  WINDOW_CLOSE,
  PAGE_OPEN,
} from "@/app/config/motion";

type Props = {
  children: ReactNode;
  /** 指定するとページ上端にウィンドウのタイトルバーを出す (✕ で戻る) */
  windowTitle?: string;
  windowColor?: TitleBarColor;
};

/** 描画直後 (hydration 前) は幅 0 に切って隠しておく。開く演出が始まると外す */
const CLOSED_CLIP = "inset(0px 100% 100% 0px)";
const FALLBACK_BAR_HEIGHT = 32;

const bezier = (v: readonly number[]) => `cubic-bezier(${v.join(",")})`;
const prefersReducedMotion = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * ページ全体をレトロ OS のウィンドウとして開閉する。
 * 開く (最大化): 押したカードからズーム矩形が画面いっぱいに広がり、
 *   タイトルバーの帯が左から伸びてファイル名が打たれ、本体が下へ展開する。
 * 閉じる (最小化): 本体がタイトルバーまで畳まれ、帯がタスクバーの Start へ吸い込まれる。
 */
export default function PageTransition({
  children,
  windowTitle,
  windowColor = "pink",
}: Props) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    el.style.clipPath = "none";

    if (prefersReducedMotion()) {
      el.animate([{ opacity: 0 }, { opacity: 1 }], {
        duration: MOTION_DURATION.reduced * 1000,
      });
      return;
    }

    const origin = getNavOrigin();
    const zoom = origin ? playZoomRects(origin, viewportRect()) : null;

    const bar = el.querySelector<HTMLElement>(".window-titlebar");
    const barH = bar?.offsetHeight ?? FALLBACK_BAR_HEIGHT;
    const vh = window.innerHeight;
    const delay = origin ? PAGE_OPEN.delayAfterZoom : 0;
    const total = PAGE_OPEN.titleWipe + PAGE_OPEN.unfold;

    const animations = [
      el.animate(
        [
          {
            clipPath: `inset(0px 100% calc(100% - ${barH}px) 0px)`,
            easing: bezier(MOTION_EASE.standard),
          },
          {
            clipPath: `inset(0px 0% calc(100% - ${barH}px) 0px)`,
            offset: PAGE_OPEN.titleWipe / total,
            easing: bezier(MOTION_EASE.enter),
          },
          { clipPath: `inset(0px 0% calc(100% - ${vh}px) 0px)` },
        ],
        { duration: total * 1000, delay: delay * 1000, fill: "backwards" }
      ),
    ];

    const title = el.querySelector<HTMLElement>(".window-title");
    if (title) {
      animations.push(
        title.animate(
          [{ clipPath: "inset(0 100% 0 0)" }, { clipPath: "inset(0 0% 0 0)" }],
          {
            duration: PAGE_OPEN.titleType * 1000,
            delay: (delay + PAGE_OPEN.titleWipe * 0.4) * 1000,
            easing: `steps(${Math.max(1, [...(title.textContent ?? "")].length)}, end)`,
            fill: "backwards",
          }
        )
      );
    }

    return () => {
      animations.forEach((a) => a.cancel());
      zoom?.cancel();
    };
  }, []);

  const startExit = async () => {
    const el = rootRef.current;
    if (!el) return;

    if (prefersReducedMotion()) {
      await el.animate([{ opacity: 1 }, { opacity: 0 }], {
        duration: MOTION_DURATION.reduced * 1000,
        fill: "forwards",
      }).finished;
      return;
    }

    // スクロール位置を基準に、いま見えている範囲をタイトルバーの帯まで畳む
    const top = window.scrollY;
    const vh = window.innerHeight;
    const barH =
      el.querySelector<HTMLElement>(".window-titlebar")?.offsetHeight ??
      FALLBACK_BAR_HEIGHT;
    const fold = el.animate(
      [
        { clipPath: `inset(${top}px 0% calc(100% - ${top + vh}px) 0px)` },
        { clipPath: `inset(${top}px 0% calc(100% - ${top + barH}px) 0px)` },
      ],
      {
        duration: WINDOW_CLOSE.fold * 1000,
        easing: bezier(MOTION_EASE.exit),
        fill: "forwards",
      }
    );

    await new Promise((r) =>
      setTimeout(r, (WINDOW_CLOSE.fold - WINDOW_CLOSE.zoomOverlap) * 1000)
    );
    // 帯をタスクバーへ飛ばす。遷移後も body 直下で飛び続け、
    // トップの起動シーケンスの Start の点灯に着地する
    playZoomRects(
      { x: 0, y: 0, width: window.innerWidth, height: barH },
      taskbarStartRect()
    );
    await fold.finished;
    el.style.opacity = "0";
  };

  return (
    <PageTransitionContext.Provider value={{ startExit }}>
      <div ref={rootRef} style={{ clipPath: CLOSED_CLIP }}>
        {windowTitle && (
          <PageTitleBar title={windowTitle} color={windowColor} />
        )}
        {children}
      </div>
    </PageTransitionContext.Provider>
  );
}

/** Provider の内側で描画し、✕ で閉じる演出 (startExit) を経由して戻る */
function PageTitleBar({ title, color }: { title: string; color: TitleBarColor }) {
  const goBack = useBackNavigation();
  return (
    <WindowTitleBar
      title={title}
      color={color}
      className="page-titlebar"
      onClose={goBack}
    />
  );
}
