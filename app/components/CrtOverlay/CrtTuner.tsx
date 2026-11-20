"use client";

import { useState } from "react";

/**
 * 開発用: CRT エフェクトの CSS 変数をスライダーで調整するパネル。
 * 既定値は globals.css の :root と揃える。決まった値は「コピー」で取り出して焼き込む。
 */
const PARAMS = [
  { key: "--crt-scan-opacity", label: "走査線の濃さ", min: 0, max: 0.5, step: 0.01, unit: "", value: 0.1 },
  { key: "--crt-scan-pitch", label: "走査線の間隔", min: 2, max: 8, step: 1, unit: "px", value: 3 },
  { key: "--crt-mask-opacity", label: "RGB 縦縞", min: 0, max: 0.3, step: 0.01, unit: "", value: 0.02 },
  { key: "--crt-vignette", label: "周辺減光", min: 0, max: 0.9, step: 0.05, unit: "", value: 0.4 },
  { key: "--crt-roll-opacity", label: "流れる帯", min: 0, max: 0.2, step: 0.01, unit: "", value: 0.05 },
  { key: "--crt-flicker", label: "ちらつき", min: 0, max: 0.1, step: 0.005, unit: "", value: 0.03 },
  { key: "--crt-aberration", label: "文字の色ずれ", min: 0, max: 2, step: 0.1, unit: "px", value: 0.8 },
  { key: "--crt-glow", label: "文字の発光", min: 0, max: 1, step: 0.05, unit: "", value: 0.2 },
] as const;

type Key = (typeof PARAMS)[number]["key"];

export default function CrtTuner() {
  const [open, setOpen] = useState(true);
  const [enabled, setEnabled] = useState(true);
  const [copied, setCopied] = useState(false);
  const [values, setValues] = useState<Record<Key, number>>(
    () => Object.fromEntries(PARAMS.map((p) => [p.key, p.value])) as Record<Key, number>
  );

  const update = (key: Key, value: number, unit: string) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    document.documentElement.style.setProperty(key, `${value}${unit}`);
  };

  const toggleEnabled = () => {
    const next = !enabled;
    setEnabled(next);
    document.documentElement.classList.toggle("crt-off", !next);
  };

  const copy = async () => {
    const css = `:root {\n${PARAMS.map((p) => `  ${p.key}: ${values[p.key]}${p.unit};`).join("\n")}\n}`;
    await navigator.clipboard.writeText(css);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  return (
    <div className="fixed right-3 bottom-12 z-[110] w-64 rounded-lg border-2 border-illustration-stroke bg-elements-background/95 text-elements-headline text-xs shadow-[4px_4px_0px_0px_rgba(18,22,41,0.6)]">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex justify-between px-3 py-1.5 font-bold bg-gradient-to-r from-[#ff69b4] to-[#eebbc3] text-elements-background"
      >
        <span>crt_tuner.dev</span>
        <span>{open ? "─" : "□"}</span>
      </button>
      {open && (
        <div className="p-3 space-y-2">
          {PARAMS.map((p) => (
            <label key={p.key} className="block">
              <span className="flex justify-between text-elements-paragraph">
                <span>{p.label}</span>
                <span className="tabular-nums">
                  {values[p.key]}
                  {p.unit}
                </span>
              </span>
              <input
                type="range"
                min={p.min}
                max={p.max}
                step={p.step}
                value={values[p.key]}
                onChange={(e) => update(p.key, Number(e.target.value), p.unit)}
                className="w-full accent-[#eebbc3]"
              />
            </label>
          ))}
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={toggleEnabled}
              className="flex-1 rounded border border-illustration-stroke px-2 py-1 bg-elements-background/60"
            >
              {enabled ? "OFF で比較" : "ON に戻す"}
            </button>
            <button
              type="button"
              onClick={copy}
              className="flex-1 rounded border border-illustration-stroke px-2 py-1 bg-elements-button text-elements-background font-bold"
            >
              {copied ? "コピーした" : "値をコピー"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
