import "server-only";

import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeRaw from "rehype-raw";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import rehypeStringify from "rehype-stringify";
import type { Root, Element } from "hast";
import { visit } from "unist-util-visit";

// rehype-sanitize は hast (HTML AST) のプロパティ名を使う
// HTML の class → hast では className、data-* → data* で一括許可
const schema = {
  ...defaultSchema,
  attributes: {
    ...defaultSchema.attributes,
    img: [
      ...(defaultSchema.attributes?.img ?? []),
      "className", "loading", "decoding", "sizes", "srcSet",
      "width", "height",
    ],
    blockquote: [...(defaultSchema.attributes?.blockquote ?? []), "className", "data*"],
    a: [...(defaultSchema.attributes?.a ?? []), "className"],
  },
};

// Next.js 画像最適化対象のホスト
const OPTIMIZABLE_HOSTS = ["supabase.co"];
// Next.js デフォルトの deviceSizes に合わせる（それ以外の幅は 400 になる）
const RESPONSIVE_WIDTHS = [640, 828, 1080, 1200];

function isOptimizable(src: string): boolean {
  try {
    const url = new URL(src);
    return OPTIMIZABLE_HOSTS.some((h) => url.hostname.endsWith(h));
  } catch {
    return false;
  }
}

function nextImageUrl(src: string, width: number, quality = 75): string {
  return `/_next/image?url=${encodeURIComponent(src)}&w=${width}&q=${quality}`;
}

/** img タグに lazy loading + Next.js 画像最適化を適用する rehype プラグイン */
function rehypeOptimizeImages() {
  return (tree: Root) => {
    visit(tree, "element", (node: Element) => {
      if (node.tagName !== "img") return;

      const src = node.properties?.src;
      if (typeof src !== "string" || !src) return;

      // 全画像に lazy loading + CLS 防止用のデフォルトサイズ
      node.properties.loading = "lazy";
      node.properties.decoding = "async";
      if (!node.properties.width) node.properties.width = 828;
      if (!node.properties.height) node.properties.height = 466;

      // Next.js 画像最適化（対象ホストのみ）
      if (isOptimizable(src)) {
        const srcset = RESPONSIVE_WIDTHS
          .map((w) => `${nextImageUrl(src, w)} ${w}w`)
          .join(", ");
        node.properties.srcSet = srcset;
        node.properties.sizes = "(max-width: 640px) 100vw, 828px";
        // src はフォールバック（srcset 非対応ブラウザ用）
        node.properties.src = nextImageUrl(src, 828);
      }
    });
  };
}

const processor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkRehype, { allowDangerousHtml: true })
  .use(rehypeRaw)
  .use(rehypeSanitize, schema)
  .use(rehypeOptimizeImages)
  .use(rehypeStringify);

/** markdown 文字列を sanitize 済み HTML に変換する（サーバー専用） */
export async function renderMarkdown(md: string): Promise<string> {
  const result = await processor.process(md);
  return String(result);
}
