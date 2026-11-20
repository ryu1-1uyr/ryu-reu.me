import type { NavRect } from "@/app/components/NavOriginTracker";
import { MOTION_EASE, ZOOM_RECTS } from "@/app/config/motion";

const TRAIL_COLORS = ["rgba(238, 187, 195, 0.95)", "rgba(184, 193, 236, 0.8)", "rgba(255, 255, 254, 0.5)"];

const toKeyframe = (r: NavRect) => ({
  left: `${r.x}px`,
  top: `${r.y}px`,
  width: `${r.width}px`,
  height: `${r.height}px`,
});

/**
 * レトロ OS のズーム矩形: 枠線の残像を from から to へ飛ばす。
 * ウィンドウの開閉の「出どころと行き先」を見せるための演出で、
 * React の描画とは独立に body 直下へ一時的な要素を置いて WAAPI で動かす。
 * 本数ぶんだけ少しずつ遅らせて残像に見せる。
 */
export function playZoomRects(
  from: NavRect,
  to: NavRect
): { finished: Promise<void>; cancel: () => void } {
  const layer = document.createElement("div");
  layer.setAttribute("aria-hidden", "true");
  layer.style.cssText = "position:fixed;inset:0;pointer-events:none;z-index:100;";
  document.body.appendChild(layer);

  const animations = TRAIL_COLORS.slice(0, ZOOM_RECTS.count).map((color, i) => {
    const el = document.createElement("div");
    el.style.cssText = `position:absolute;box-sizing:border-box;border:2px solid ${color};border-radius:8px;opacity:0;`;
    layer.appendChild(el);
    return el.animate(
      [
        { ...toKeyframe(from), opacity: 0 },
        { opacity: 1, offset: 0.12 },
        { opacity: 0.9, offset: 0.8 },
        { ...toKeyframe(to), opacity: 0 },
      ],
      {
        duration: ZOOM_RECTS.duration,
        delay: i * ZOOM_RECTS.trailDelay,
        easing: `cubic-bezier(${MOTION_EASE.travel.join(",")})`,
        fill: "both",
      }
    );
  });

  const finished = Promise.all(animations.map((a) => a.finished))
    .catch(() => undefined)
    .then(() => layer.remove());

  return {
    finished,
    cancel: () => animations.forEach((a) => a.cancel()),
  };
}

export function viewportRect(): NavRect {
  return { x: 0, y: 0, width: window.innerWidth, height: window.innerHeight };
}

/**
 * 最小化の行き先 = タスクバーの Start ボタン。
 * 記事ページなどタスクバーが無い画面では、トップで Start が現れる位置を使う
 */
export function taskbarStartRect(): NavRect {
  const start = document.querySelector(".boot-start");
  if (start) {
    const r = start.getBoundingClientRect();
    return { x: r.x, y: r.y, width: r.width, height: r.height };
  }
  return { x: 8, y: window.innerHeight - 36, width: 72, height: 28 };
}
