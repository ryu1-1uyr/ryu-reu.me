"use client";

import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import rehypePrettyCode from "rehype-pretty-code";
import { getClientHighlighter } from "@/lib/markdown-client";
import { remarkForceLineNumbers } from "@/lib/markdown-shared";

/**
 * 編集プレビュー用の Markdown レンダラー。
 *
 * SSR (lib/markdown.ts) と同じ rehype-pretty-code + shiki + github-light で
 * ハイライトすることで、本番表示と見た目を完全一致させる。
 *
 * shiki の初期化は非同期なので、初回マウント時にロード完了まで「準備中…」を出し、
 * 完了後にハイライト付きで再描画する。2 回目以降はモジュールスコープ Promise が
 * キャッシュしているので即時表示。
 *
 * このコンポーネントは "use client" 境界に閉じているので、shiki + 言語 grammar の
 * バンドルは読者ページ (/posts/[slug]) には漏れない (= エディタページ専用)。
 */
export default function MarkdownPreview({ content }: { content: string }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getClientHighlighter().then(() => {
      if (!cancelled) setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!ready) {
    return <p className="text-gray-400 italic">プレビューを準備中…</p>;
  }

  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm, remarkForceLineNumbers]}
      rehypePlugins={[
        rehypeRaw,
        [
          rehypePrettyCode,
          {
            theme: "github-light",
            defaultLang: "plaintext",
            keepBackground: true,
            bypassInlineCode: true,
            getHighlighter: async () => (await getClientHighlighter()) as never,
          },
        ],
      ]}
    >
      {content}
    </ReactMarkdown>
  );
}
