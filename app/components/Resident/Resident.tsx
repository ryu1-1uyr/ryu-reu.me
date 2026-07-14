"use client";

import { useEffect, useRef } from "react";
import { useSurfaceRegistry } from "@/app/contexts/SurfaceRegistry";
import { useWeatherFxBus } from "@/app/contexts/WeatherFxBus";
import { useWeatherData } from "@/app/hooks/useWeatherData";
import { useSkyPhase } from "@/app/hooks/useSkyPhase";
import { getEffectiveWind } from "@/app/components/SkyBackground/weatherEngine";
import { onThunder } from "@/app/components/SkyBackground/thunderBus";
import { stompSnow } from "@/app/components/WeatherFxOverlay/snowFx";
import {
  CALM_ENV,
  createResident,
  tick,
  hop,
  grab,
  moveHeld,
  releaseHeld,
  setGreeting,
  type Platform,
  type ResidentEnv,
  type ResidentState,
} from "./residentEngine";
import { recordVisit, recordInteraction } from "./residentMemory";
import { computePose } from "./residentPose";
import { pinkSkin } from "./skins/placeholderSkin";
import type { ResidentSkin } from "./skins/types";

/** ドラッグ開始とみなすポインタ移動距離 (px)。未満なら hop 扱い */
const DRAG_THRESHOLD = 5;

/** この間隔以上空いた再訪を「久しぶり」とみなし、喜びの挨拶をする (ms) */
const LONG_ABSENCE_MS = 3 * 24 * 60 * 60 * 1000;

type DragTracking = {
  pointerId: number;
  grabbed: boolean;
  startX: number;
  startY: number;
  lastX: number;
  lastY: number;
  lastT: number;
  vx: number;
  vy: number;
};

/**
 * デスクトップの住人。
 * SurfaceRegistry のウィンドウ・タスクバー上辺を足場に歩き回る。
 * このコンポーネントは位置 transform・rAF・入力・環境収集のみを担当し、
 * 見た目はすべて skin（ResidentSkin）経由で描画する。
 */
export default function Resident({ skin = pinkSkin }: { skin?: ResidentSkin }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const registry = useSurfaceRegistry();
  const bus = useWeatherFxBus();
  const stateRef = useRef<ResidentState | null>(null);
  const dragRef = useRef<DragTracking | null>(null);

  // 時間帯は 60 秒毎に再計算されるため、ref 転写で rAF effect の再実行を避ける
  const { weatherData } = useWeatherData();
  const { phase } = useSkyPhase(weatherData?.sunrise, weatherData?.sunset);
  const isNightRef = useRef(false);
  useEffect(() => {
    isNightRef.current = phase === "night";
  }, [phase]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root || !registry) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      root.style.display = "none";
      return;
    }

    const viewport = { width: window.innerWidth, height: window.innerHeight };
    const state = createResident(viewport);
    stateRef.current = state;
    const skinInstance = skin.mount(root);

    // 訪問を記録し、挨拶を予約する（久しぶりの喜び > 夜のあくびの順で優先）
    const visit = recordVisit();
    if (
      visit.previous &&
      Date.now() - visit.previous.lastVisitAt >= LONG_ABSENCE_MS
    ) {
      setGreeting(state, "joy");
    } else if (isNightRef.current) {
      setGreeting(state, "sleepy");
    }

    // 視線追従用: 最後のポインタ位置
    let pointerPos: { x: number; y: number } | null = null;
    const onPointerMove = (e: PointerEvent) => {
      pointerPos = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener("pointermove", onPointerMove, { passive: true });

    // SkyCanvas の稲妻と同期した雷鳴イベント。次の tick で 1 回だけ消費する
    let thunderPending = false;
    const offThunder = onThunder(() => {
      thunderPending = true;
    });

    let rafId = 0;
    let lastTime = 0;
    // 積雪の踏み散らし: 前回 stomp した位置と直前の状態名
    let lastStompX = Infinity;
    let prevName = state.name;

    function loop(time: number) {
      rafId = requestAnimationFrame(loop);
      const delta = Math.min(lastTime ? time - lastTime : 16.67, 100);
      lastTime = time;

      viewport.width = window.innerWidth;
      viewport.height = window.innerHeight;

      // 足場: 登録サーフェスの上辺 + 画面最下部（保険の地面）
      const platforms: Platform[] = [
        { id: "__ground", x: 0, y: viewport.height, width: viewport.width },
      ];
      registry!.getSurfaces().forEach((el, id) => {
        const r = el.getBoundingClientRect();
        platforms.push({ id, x: r.x, y: r.y, width: r.width });
      });

      // 環境入力: 共有エンジンの補間済みチャンネル値（bus がなければ無風・晴天扱い）
      const engine = bus?.getEngine();
      const thunder = thunderPending;
      thunderPending = false;
      const env: ResidentEnv = engine
        ? {
            rain: engine.current.rain,
            snow: engine.current.snow,
            wind: getEffectiveWind(engine),
            lightning: engine.current.lightning,
            isNight: isNightRef.current,
            thunder,
          }
        : { ...CALM_ENV, isNight: isNightRef.current, thunder };

      tick(state, delta, platforms, viewport, Math.random, env);

      // 積雪の踏み散らし: 着地時は広めに、歩行中は 6px 進むごとに足元を蹴散らす
      const snowFx = bus?.getSnowFx();
      if (snowFx && state.platformId) {
        if (state.name === "land" && prevName !== "land") {
          stompSnow(snowFx, state.platformId, state.x, 10);
          lastStompX = state.x;
        } else if (state.name === "walk" || state.name === "shelterSeek") {
          if (Math.abs(state.x - lastStompX) >= 6) {
            stompSnow(snowFx, state.platformId, state.x, 6);
            lastStompX = state.x;
          }
        }
      }
      prevName = state.name;

      const pose = computePose(state, env, time);
      root!.style.transform = `translate3d(${state.x - skin.size / 2}px, ${
        state.y - skin.size + pose.bobY
      }px, 0)`;
      // 目（体の中心付近）から見たポインタの相対位置
      const pointer = pointerPos
        ? {
            dx: pointerPos.x - state.x,
            dy: pointerPos.y - (state.y - skin.size / 2),
          }
        : undefined;
      skinInstance.apply(pose, state.facing, pointer);
    }

    rafId = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("pointermove", onPointerMove);
      offThunder();
      skinInstance.unmount();
      stateRef.current = null;
    };
  }, [registry, bus, skin]);

  return (
    <div
      ref={rootRef}
      className="fixed left-0 top-0 z-[55] cursor-grab select-none will-change-transform"
      style={{ width: skin.size, height: skin.size, touchAction: "none" }}
      onPointerDown={(e) => {
        if (!stateRef.current) return;
        e.currentTarget.setPointerCapture(e.pointerId);
        dragRef.current = {
          pointerId: e.pointerId,
          grabbed: false,
          startX: e.clientX,
          startY: e.clientY,
          lastX: e.clientX,
          lastY: e.clientY,
          lastT: performance.now(),
          vx: 0,
          vy: 0,
        };
      }}
      onPointerMove={(e) => {
        const d = dragRef.current;
        const state = stateRef.current;
        if (!d || !state || e.pointerId !== d.pointerId) return;
        if (!d.grabbed) {
          if (
            Math.hypot(e.clientX - d.startX, e.clientY - d.startY) <
            DRAG_THRESHOLD
          ) {
            return;
          }
          d.grabbed = true;
          grab(state);
        }
        // 投げ初速用のポインタ速度（軽く平滑化）
        const now = performance.now();
        const dt = now - d.lastT;
        if (dt > 0) {
          d.vx = d.vx * 0.6 + ((e.clientX - d.lastX) / dt) * 1000 * 0.4;
          d.vy = d.vy * 0.6 + ((e.clientY - d.lastY) / dt) * 1000 * 0.4;
        }
        d.lastX = e.clientX;
        d.lastY = e.clientY;
        d.lastT = now;
        // ポインタは体の中心を掴む想定なので、足元へ半身ぶん下げる
        moveHeld(state, e.clientX, e.clientY + skin.size / 2, {
          width: window.innerWidth,
          height: window.innerHeight,
        });
      }}
      onPointerUp={(e) => {
        const d = dragRef.current;
        const state = stateRef.current;
        if (!d || !state || e.pointerId !== d.pointerId) return;
        dragRef.current = null;
        if (d.grabbed) {
          releaseHeld(state, d.vx, d.vy);
          recordInteraction("throw");
        } else {
          hop(state);
          recordInteraction("hop");
        }
      }}
      onPointerCancel={() => {
        const d = dragRef.current;
        const state = stateRef.current;
        dragRef.current = null;
        if (d?.grabbed && state) releaseHeld(state, 0, 0);
      }}
      aria-hidden="true"
    />
  );
}
