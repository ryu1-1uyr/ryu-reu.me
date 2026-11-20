"use client";

import { useEffect, useRef, useState } from "react";
import { SYSTEM_LOG } from "@/app/config/motion";
import {
  getShaderReveal,
  useSkyRenderer,
  useSweepId,
  type SkyRenderer,
} from "@/app/components/SkyBackground/skyRenderer";
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

let webgl2Cache: boolean | null = null;
function hasWebGL2(): boolean {
  if (webgl2Cache === null) {
    const gl = document.createElement("canvas").getContext("webgl2");
    webgl2Cache = !!gl;
    gl?.getExtension("WEBGL_lose_context")?.loseContext();
  }
  return webgl2Cache;
}

function progressBar(reveal: number): string {
  const cells = 10;
  const filled = Math.round(reveal * cells);
  const pct = String(Math.round(reveal * 100)).padStart(3, "0");
  return `SCAN [${"■".repeat(filled)}${"□".repeat(cells - filled)}] ${pct}%`;
}

type Line = { text: string; tone: LogTone };

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
    const reduce = prefersReducedMotion();
    playLogEnter(root, reduce);

    const start = performance.now();
    let resultAt: number | null = null;
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
        const appearAt = lineAppearAt(i, reduce);
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
        el.textContent = decode(row.text, decodeProgress(since, reduce));
      });

      if (resultAt !== null && t - resultAt >= SYSTEM_LOG.holdMs) {
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
    <LogShell rootRef={rootRef} title="sky_shader.log" summary={result.text}>
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
