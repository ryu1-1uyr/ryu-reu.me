"use client";

import { useEffect } from "react";

declare global {
  interface Window {
    twttr?: { widgets: { load: (el?: HTMLElement) => void } };
  }
}

const WIDGETS_SRC = "https://platform.twitter.com/widgets.js";

/**
 * 記事 HTML 内に .twitter-tweet が存在する場合のみ
 * Twitter widgets.js を読み込んで埋め込みを有効化する。
 *
 * - 二重 append 防止: 既存の <script> があれば再利用
 * - onerror ハンドラ: スクリプト読み込み失敗時はサイレントに諦める（埋め込みは表示されないだけ）
 * - cleanup: 自分が append したスクリプトのみ削除（parentNode 経由で再マウント時のクラッシュ防止）
 */
export default function TwitterEmbed({ html }: { html: string }) {
  const hasTweet = html.includes("twitter-tweet");

  useEffect(() => {
    if (!hasTweet) return;

    // 既に widgets.js がロード済みなら load() だけ呼ぶ
    if (window.twttr) {
      window.twttr.widgets.load();
      return;
    }

    // 既存の script タグがあれば（別タブで読み込み中など）二重 append しない
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${WIDGETS_SRC}"]`
    );
    if (existing) {
      // 読み込み完了後に load() がフックされるので何もしない
      return;
    }

    const script = document.createElement("script");
    script.src = WIDGETS_SRC;
    script.async = true;
    script.onerror = () => {
      // 読み込み失敗は致命的じゃない（埋め込みが出ないだけ）
      console.error("Failed to load Twitter widgets.js");
    };
    document.body.appendChild(script);

    return () => {
      // 再マウント時に既に削除済みのケースを考慮
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, [hasTweet]);

  return null;
}
