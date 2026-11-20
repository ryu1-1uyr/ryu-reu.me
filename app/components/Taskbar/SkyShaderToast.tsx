"use client";

import { useEffect, useRef, useState } from "react";
import { MOTION_DURATION, MOTION_EASE } from "@/app/config/motion";
import { SKY_SWAP } from "@/app/config/skyShader";
import {
  getShaderReveal,
  useSkyRenderer,
  useSweepId,
  type SkyRenderer,
} from "@/app/components/SkyBackground/skyRenderer";

/**
 * sky_shader.exe の起動・終了ログ。Start メニューがあった位置に出し、
 * 空を走査線で積み替える進み具合を、行ごとに確定していくログで見せる。
 */
export default function SkyShaderToast() {
  const sweepId = useSweepId();
  const renderer = useSkyRenderer();
  if (sweepId === 0) return null;
  // 切り替えのたびに作り直す (途中で反転したら新しいログに差し替わる)
  return <SwapLog key={sweepId} mode={renderer} />;
}

const GLYPHS = "▓▒░#/\\<>01";

let webgl2Cache: boolean | null = null;
function hasWebGL2(): boolean {
  if (webgl2Cache === null) {
    const gl = document.createElement("canvas").getContext("webgl2");
    webgl2Cache = !!gl;
    gl?.getExtension("WEBGL_lose_context")?.loseContext();
  }
  return webgl2Cache;
}

/** 左から確定し、残りはランダムな記号で埋める (空白は保つ) */
function decode(text: string, p: number): string {
  const fixed = Math.floor(text.length * p);
  let out = text.slice(0, fixed);
  for (let i = fixed; i < text.length; i++) {
    out += text[i] === " " ? " " : GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
  }
  return out;
}

function progressBar(reveal: number): string {
  const cells = 10;
  const filled = Math.round(reveal * cells);
  const pct = String(Math.round(reveal * 100)).padStart(3, "0");
  return `SCAN [${"■".repeat(filled)}${"□".repeat(cells - filled)}] ${pct}%`;
}

type Line = { text: string; tone: "ink" | "ok" | "warn" };

function buildLines(mode: SkyRenderer, webgl: boolean): { head: Line[]; result: Line } {
  if (mode === "shader") {
    return {
      head: [
        { text: "> sky_shader.exe", tone: "ink" },
        webgl
          ? { text: "WEBGL2 ......... OK", tone: "ok" }
          : { text: "WEBGL2 ........ N/A", tone: "warn" },
      ],
      result: webgl
        ? { text: "SKY: SHADER ONLINE", tone: "ok" }
        : { text: "SKY: CANVAS2D (FALLBACK)", tone: "warn" },
    };
  }
  return {
    head: [
      { text: "> sky_shader.exe --kill", tone: "ink" },
      { text: "RELEASE GPU .... OK", tone: "ok" },
    ],
    result: { text: "SKY: CANVAS2D", tone: "ok" },
  };
}

const TONE_CLASS: Record<Line["tone"], string> = {
  ink: "text-elements-headline",
  ok: "text-[#7fdbca]",
  warn: "text-[#eebbc3]",
};

function SwapLog({ mode }: { mode: SkyRenderer }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const lineRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const [webgl] = useState(hasWebGL2);
  const [done, setDone] = useState(false);
  const { head, result } = buildLines(mode, webgl);
  // 行の並び: 見出し 2 行 → 進捗 → 結果
  const rows: Line[] = [...head, { text: progressBar(0), tone: "ink" }, result];
  const progressRow = head.length;
  const resultRow = head.length + 1;
  const target = mode === "shader" ? 1 : 0;

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const enter = reduce ? MOTION_DURATION.reduced : 0.16;
    root.animate(
      [
        { opacity: 0, transform: reduce ? "none" : "scaleY(0.92)" },
        { opacity: 1, transform: "none" },
      ],
      { duration: enter * 1000, easing: `cubic-bezier(${MOTION_EASE.enter.join(",")})` },
    );

    const start = performance.now();
    let resultAt: number | null = null;
    let fading = false;
    let raf = 0;

    // 経過時間と走査の進み具合だけから、各行の表示を決める
    const frame = () => {
      const now = performance.now();
      const t = now - start;
      const reveal = getShaderReveal(now);
      const swept = Math.abs(reveal - target) < 1e-3;

      rows.forEach((row, i) => {
        const el = lineRefs.current[i];
        if (!el) return;
        const appearAt = reduce ? 0 : i * SKY_SWAP.lineStaggerMs;
        let visible = t >= appearAt;
        if (i === resultRow) {
          if (swept && resultAt === null && t >= appearAt) resultAt = t;
          visible = resultAt !== null;
        }
        el.style.visibility = visible ? "visible" : "hidden";
        if (!visible) return;
        if (i === progressRow) {
          el.textContent = progressBar(reveal);
          return;
        }
        const since = i === resultRow ? t - (resultAt ?? t) : t - appearAt;
        const p = reduce ? 1 : Math.min(1, since / SKY_SWAP.decodeMs);
        el.textContent = decode(row.text, p);
      });

      if (resultAt !== null && !fading && t - resultAt >= SKY_SWAP.holdMs) {
        fading = true;
        const fade = root.animate([{ opacity: 1 }, { opacity: 0 }], {
          duration: SKY_SWAP.fadeMs,
          easing: `cubic-bezier(${MOTION_EASE.exit.join(",")})`,
          fill: "forwards",
        });
        fade.onfinish = () => setDone(true);
        return;
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
    // 1 回のログは作られた時点の内容で再生しきる
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (done) return null;

  return (
    <div
      ref={rootRef}
      role="status"
      className="pointer-events-none absolute bottom-full left-0 mb-1 w-60 origin-bottom-left rounded-lg border-2 border-illustration-stroke bg-elements-background/95 backdrop-blur-md shadow-[4px_4px_0px_0px_rgba(18,22,41,0.6)] overflow-hidden"
    >
      <div className="bg-gradient-to-r from-[#7fdbca] to-[#b8c1ec] px-3 py-1 border-b-2 border-illustration-stroke">
        <span className="text-[10px] font-bold text-elements-background tracking-wider">
          sky_shader.log
        </span>
      </div>
      <p className="sr-only">{result.text}</p>
      <div aria-hidden="true" className="px-3 py-2 font-mono text-[11px] leading-5">
        {rows.map((row, i) => (
          <span
            key={i}
            ref={(el) => {
              lineRefs.current[i] = el;
            }}
            className={`block whitespace-pre ${TONE_CLASS[row.tone]}`}
            style={{ visibility: "hidden" }}
          >
            {row.text}
          </span>
        ))}
      </div>
    </div>
  );
}
