"use client";

import { useEffect, useState } from "react";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeRaw from "rehype-raw";
import rehypePrettyCode from "rehype-pretty-code";
import rehypeStringify from "rehype-stringify";
import { getClientHighlighter } from "@/lib/markdown-client";
import { remarkForceLineNumbers } from "@/lib/markdown-shared";

/**
 * 編集プレビュー用の Markdown レンダラー。
 *
 * SSR (lib/markdown.ts) と同じ rehype-pretty-code + shiki + github-light で
 * ハイライトすることで、本番表示と見た目を一致させる。
 *
 * react-markdown はプラグインを runSync で同期実行するが、rehype-pretty-code の
 * transformer は常に async（内部で highlighter を await する）ため、組み合わせると
 * 「`runSync` finished async. Use `run` instead」で落ちる。そのため react-markdown
 * は使わず、SSR と同じ unified パイプラインを非同期に実行して HTML を差し込む。
 *
 * このコンポーネントは "use client" 境界に閉じているので、shiki + 言語 grammar の
 * バンドルは読者ページ (/posts/[slug]) には漏れない (= エディタページ専用)。
 */

// 入力のたびに全文パース + ハイライトすると重いので軽くデバウンスする
const RENDER_DEBOUNCE_MS = 150;

const processor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkForceLineNumbers)
  .use(remarkRehype, { allowDangerousHtml: true })
  .use(rehypeRaw)
  .use(rehypePrettyCode, {
    theme: "github-light",
    defaultLang: "plaintext",
    keepBackground: true,
    bypassInlineCode: true,
    // 共有 highlighter を渡す。型が複雑なので as never で逃がす
    getHighlighter: async () => (await getClientHighlighter()) as never,
  })
  .use(rehypeStringify);

export default function MarkdownPreview({ content }: { content: string }) {
  const [html, setHtml] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(() => {
      processor.process(content).then(
        (file) => {
          if (!cancelled) setHtml(String(file));
        },
        () => {
          // パース失敗時は直前の表示を維持する
        }
      );
    }, RENDER_DEBOUNCE_MS);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [content]);

  // 初回レンダリング完了まで（shiki ロード含む）はプレースホルダ。
  // 2 回目以降の再レンダリング中は直前の HTML を出し続けるのでチラつかない。
  if (html === null) {
    return <p className="text-gray-400 italic">プレビューを準備中…</p>;
  }

  return <div dangerouslySetInnerHTML={{ __html: html }} />;
}
