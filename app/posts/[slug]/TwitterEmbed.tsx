"use client";

import { useEffect } from "react";

declare global {
  interface Window {
    twttr?: { widgets: { load: (el?: HTMLElement) => void } };
  }
}

/**
 * 記事 HTML 内に .twitter-tweet が存在する場合のみ
 * Twitter widgets.js を読み込んで埋め込みを有効化する。
 */
export default function TwitterEmbed({ html }: { html: string }) {
  const hasTweet = html.includes("twitter-tweet");

  useEffect(() => {
    if (!hasTweet) return;

    if (window.twttr) {
      window.twttr.widgets.load();
      return;
    }

    const script = document.createElement("script");
    script.src = "https://platform.twitter.com/widgets.js";
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, [hasTweet]);

  return null;
}
