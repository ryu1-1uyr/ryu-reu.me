"use client";

import { createHighlighter, type Highlighter } from "shiki";

/**
 * CSR (編集プレビュー) 用 shiki Highlighter のシングルトン。
 *
 * - サーバー側 (lib/markdown.ts) と同じテーマ・言語セットで揃え、見た目を一致させる
 * - クライアントの初回呼び出し時にロード → 以降は同じ Promise を返す
 * - shiki の WASM・grammar はサーバーとブラウザで別バイナリなのでインスタンスは共有しない
 *
 * 言語セットを変える時は SSR 側 (lib/markdown.ts:getHighlighter) も同期して更新する。
 */
let highlighterPromise: Promise<Highlighter> | null = null;

export function getClientHighlighter() {
  if (!highlighterPromise) {
    highlighterPromise = createHighlighter({
      themes: ["github-light"],
      langs: [
        "ts", "tsx", "js", "jsx", "json", "bash", "css", "html",
        "md", "sql", "python", "yaml", "diff",
      ],
    });
  }
  return highlighterPromise;
}
