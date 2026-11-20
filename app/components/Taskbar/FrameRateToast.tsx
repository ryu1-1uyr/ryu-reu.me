"use client";

import { useEffect, useRef, useState } from "react";
import { SYSTEM_LOG } from "@/app/config/motion";
import {
  createFrameGate,
  useFrameCap,
  useFrameCapChangeId,
  type FrameCap,
} from "@/app/hooks/frameCap";
import {
  LogLine,
  LogShell,
  decode,
  decodeProgress,
  lineAppearAt,
  playLogEnter,
  playLogExit,
  prefersReducedMotion,
  type LogTone,
} from "./systemLog";

/**
 * framerate.exe の切り替えログ。映写機の回転数を切り替える見立てで、
 * 選んだコマ数そのもので進むフレームカウンターを見せる (24 ならゆっくり、∞ なら速く進む)。
 */
export default function FrameRateToast() {
  const changeId = useFrameCapChangeId();
  const cap = useFrameCap();
  if (changeId === 0) return null;
  return <RateLog key={changeId} cap={cap} />;
}

/** カウンターを回す時間。24fps で 12 コマほど見せてから結果を出す */
const COUNT_MS = 520;
/** シャッターの帯のコマ数 */
const SHUTTER_CELLS = 8;

type Line = { text: string; tone: LogTone };

function capLabel(cap: FrameCap): string {
  return cap === null ? "OFF" : String(cap);
}

function counterLine(frames: number): string {
  const lit = frames % SHUTTER_CELLS;
  const strip = Array.from({ length: SHUTTER_CELLS }, (_, i) => (i === lit ? "■" : "□")).join("");
  return `FRM ${String(frames).padStart(4, "0")} [${strip}]`;
}

function buildLines(cap: FrameCap): { head: Line[]; result: Line } {
  return {
    head: [
      { text: `> framerate.exe --fps ${cap ?? "max"}`, tone: "ink" },
      { text: `CAP ............ ${capLabel(cap)}`, tone: cap === null ? "warn" : "ok" },
    ],
    result:
      cap === null
        ? { text: "PROJECTOR: UNLOCKED", tone: "warn" }
        : { text: `PROJECTOR: LOCKED @ ${cap}FPS`, tone: "ok" },
  };
}

function RateLog({ cap }: { cap: FrameCap }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const lineRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const [done, setDone] = useState(false);
  const { head, result } = buildLines(cap);
  // 行の並び: 見出し 2 行 → カウンター → 結果
  const rows: Line[] = [...head, { text: counterLine(0), tone: "ink" }, result];
  const counterRow = head.length;
  const resultRow = head.length + 1;

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const reduce = prefersReducedMotion();
    playLogEnter(root, reduce);

    // カウンターは描画ループと同じ関所を通ったフレームだけ進める
    const gate = createFrameGate(() => cap);
    const start = performance.now();
    const counterAt = lineAppearAt(counterRow, reduce);
    const resultAt = counterAt + (reduce ? 0 : COUNT_MS);
    let frames = 0;
    let raf = 0;

    const frame = (now: number) => {
      const t = now - start;
      rows.forEach((row, i) => {
        const el = lineRefs.current[i];
        if (!el) return;
        const appearAt = i === resultRow ? resultAt : lineAppearAt(i, reduce);
        const visible = t >= appearAt;
        el.style.visibility = visible ? "visible" : "hidden";
        if (!visible) return;
        if (i === counterRow) {
          if (gate(now)) frames += 1;
          el.textContent = counterLine(frames);
          return;
        }
        el.textContent = decode(row.text, decodeProgress(t - appearAt, reduce));
      });

      if (t - resultAt >= SYSTEM_LOG.holdMs) {
        playLogExit(root, () => setDone(true));
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
    <LogShell rootRef={rootRef} title="framerate.log" summary={result.text}>
      {rows.map((row, i) => (
        <LogLine
          key={i}
          tone={row.tone}
          lineRef={(el) => {
            lineRefs.current[i] = el;
          }}
        >
          {row.text}
        </LogLine>
      ))}
    </LogShell>
  );
}
