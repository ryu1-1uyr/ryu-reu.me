"use client";

import type { ReactNode, RefObject } from "react";
import { MOTION_DURATION, MOTION_EASE, SYSTEM_LOG } from "@/app/config/motion";

/**
 * Start メニューの位置に出るログ窓の共通部品。
 * 各ログは 1 本の rAF で、経過時間から行の表示を決める (前フレームの状態を使わない)。
 */

export type LogTone = "ink" | "ok" | "warn";

export const TONE_CLASS: Record<LogTone, string> = {
  ink: "text-elements-headline",
  ok: "text-[#7fdbca]",
  warn: "text-[#eebbc3]",
};

const GLYPHS = "▓▒░#/\\<>01";

/** 左から確定し、残りはランダムな記号で埋める (空白は保つ) */
export function decode(text: string, p: number): string {
  const fixed = Math.floor(text.length * p);
  let out = text.slice(0, fixed);
  for (let i = fixed; i < text.length; i++) {
    out += text[i] === " " ? " " : GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
  }
  return out;
}

/** i 行目が出る時刻 (ms) */
export function lineAppearAt(i: number, reduce: boolean): number {
  return reduce ? 0 : i * SYSTEM_LOG.lineStaggerMs;
}

/** 行が出てからの経過で、文字がどこまで確定したか (0..1) */
export function decodeProgress(since: number, reduce: boolean): number {
  return reduce ? 1 : Math.min(1, since / SYSTEM_LOG.decodeMs);
}

export function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** Start メニューのあった位置から縦に開く */
export function playLogEnter(root: HTMLElement, reduce: boolean): void {
  root.animate(
    [
      { opacity: 0, transform: reduce ? "none" : "scaleY(0.92)" },
      { opacity: 1, transform: "none" },
    ],
    {
      duration: (reduce ? MOTION_DURATION.reduced : 0.16) * 1000,
      easing: `cubic-bezier(${MOTION_EASE.enter.join(",")})`,
    },
  );
}

export function playLogExit(root: HTMLElement, onDone: () => void): void {
  const fade = root.animate([{ opacity: 1 }, { opacity: 0 }], {
    duration: SYSTEM_LOG.fadeMs,
    easing: `cubic-bezier(${MOTION_EASE.exit.join(",")})`,
    fill: "forwards",
  });
  fade.onfinish = onDone;
}

type ShellProps = {
  rootRef: RefObject<HTMLDivElement | null>;
  title: string;
  /** スクリーンリーダーに読ませる結果 (表示中の行は装飾として隠す) */
  summary: string;
  children: ReactNode;
};

export function LogShell({ rootRef, title, summary, children }: ShellProps) {
  return (
    <div
      ref={rootRef}
      role="status"
      className="pointer-events-none absolute bottom-full left-0 mb-1 w-60 origin-bottom-left rounded-lg border-2 border-illustration-stroke bg-elements-background/95 backdrop-blur-md shadow-[4px_4px_0px_0px_rgba(18,22,41,0.6)] overflow-hidden"
    >
      <div className="bg-gradient-to-r from-[#7fdbca] to-[#b8c1ec] px-3 py-1 border-b-2 border-illustration-stroke">
        <span className="text-[10px] font-bold text-elements-background tracking-wider">
          {title}
        </span>
      </div>
      <p className="sr-only">{summary}</p>
      <div aria-hidden="true" className="px-3 py-2 font-mono text-[11px] leading-5">
        {children}
      </div>
    </div>
  );
}

type LineProps = {
  tone: LogTone;
  lineRef: (el: HTMLSpanElement | null) => void;
  children: string;
};

/** 最初は隠しておき、ログの rAF が表示と文字を書き換える */
export function LogLine({ tone, lineRef, children }: LineProps) {
  return (
    <span
      ref={lineRef}
      className={`block whitespace-pre ${TONE_CLASS[tone]}`}
      style={{ visibility: "hidden" }}
    >
      {children}
    </span>
  );
}
