"use client";

import { useState } from "react";
import { SKY_DITHER } from "@/app/config/skyShader";
import { setSkyFilter } from "./skyFilter";

/**
 * 開発用: 空の減色ディザを試すパネル。
 * 決まった値は「コピー」で取り出して config/skyShader.ts の SKY_DITHER に焼き込む。
 */
const PARAMS = [
  { key: "levels", label: "階調 (1ch あたり)", min: 2, max: 8, step: 1 },
  { key: "pixel", label: "ドットの大きさ", min: 1, max: 4, step: 1 },
  { key: "spread", label: "ディザの強さ", min: 0, max: 1, step: 0.05 },
] as const;

type Key = (typeof PARAMS)[number]["key"];

export default function SkyDitherTuner() {
  const [open, setOpen] = useState(true);
  const [enabled, setEnabled] = useState(SKY_DITHER.enabled);
  const [copied, setCopied] = useState(false);
  const [values, setValues] = useState<Record<Key, number>>({
    levels: SKY_DITHER.levels,
    pixel: SKY_DITHER.pixel,
    spread: SKY_DITHER.spread,
  });

  const update = (key: Key, value: number) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    setSkyFilter({ [key]: value });
  };

  const toggleEnabled = () => {
    const next = !enabled;
    setEnabled(next);
    setSkyFilter({ dither: next });
  };

  const copy = async () => {
    const text = `enabled: ${enabled}, levels: ${values.levels}, pixel: ${values.pixel}, spread: ${values.spread}`;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  return (
    <div className="fixed left-3 top-3 z-[110] w-56 rounded-lg border-2 border-illustration-stroke bg-elements-background/95 text-elements-headline text-xs shadow-[4px_4px_0px_0px_rgba(18,22,41,0.6)]">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex justify-between px-3 py-1.5 font-bold bg-gradient-to-r from-[#7fdbca] to-[#b8c1ec] text-elements-background"
      >
        <span>sky_dither.dev</span>
        <span>{open ? "─" : "□"}</span>
      </button>
      {open && (
        <div className="p-3 space-y-2">
          {PARAMS.map((p) => (
            <label key={p.key} className="block">
              <span className="flex justify-between text-elements-paragraph">
                <span>{p.label}</span>
                <span className="tabular-nums">{values[p.key]}</span>
              </span>
              <input
                type="range"
                min={p.min}
                max={p.max}
                step={p.step}
                value={values[p.key]}
                onChange={(e) => update(p.key, Number(e.target.value))}
                className="w-full accent-[#7fdbca]"
              />
            </label>
          ))}
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={toggleEnabled}
              className="flex-1 rounded border border-illustration-stroke px-2 py-1 bg-elements-background/60"
            >
              {enabled ? "OFF で比較" : "ディザ ON"}
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
