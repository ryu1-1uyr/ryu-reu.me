import "server-only";

import { unstable_cache } from "next/cache";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeRaw from "rehype-raw";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import rehypeStringify from "rehype-stringify";
import rehypePrettyCode, { type Options as PrettyCodeOptions } from "rehype-pretty-code";
import { createHighlighter, type Highlighter } from "shiki";
import type { Root, Element } from "hast";
import type { Root as MdastRoot, Code as MdastCode } from "mdast";
import { visit } from "unist-util-visit";
import probe from "probe-image-size";

// shiki Highlighter のモジュールスコープ Promise キャッシュ。
// 全 SSG ページが同一インスタンスを再利用するため、初期化コスト (テーマ + 言語 grammar
// のロード) はビルド全体で 1 回だけ。
let highlighterPromise: Promise<Highlighter> | null = null;
function getHighlighter() {
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

/**
 * 全コードフェンスに `showLineNumbers` meta を強制注入する remark plugin。
 * rehype-pretty-code が `defaultLineNumbers` オプションを持たないため、
 * remark 段階で markdown AST を書き換える方式で対応。
 *
 * CSR (react-markdown) からも import して共有する。
 */
export function remarkForceLineNumbers() {
  return (tree: MdastRoot) => {
    visit(tree, "code", (node: MdastCode) => {
      const existing = node.meta ?? "";
      if (!existing.includes("showLineNumbers")) {
        node.meta = existing ? `${existing} showLineNumbers` : "showLineNumbers";
      }
    });
  };
}

const prettyCodeOptions: PrettyCodeOptions = {
  theme: "github-light",
  defaultLang: "plaintext",
  keepBackground: true,
  // inline `code` (バッククォート 1 個) はハイライト対象外。
  // prose のデフォルトスタイル (背景色 + ::before/::after のバッククォート) に任せる。
  bypassInlineCode: true,
  // 共有 highlighter を渡す。型が複雑なので as never で逃がす
  getHighlighter: async () => (await getHighlighter()) as never,
};

// rehype-sanitize は hast (HTML AST) のプロパティ名を使う
// HTML の class → hast では className、data-* → data* で一括許可
//
// shiki / rehype-pretty-code が出力する <figure>, <pre>, <code>, <span> の
// className / style / data-* / tabindex を許可しないとシンタックスハイライトが
// sanitize で剥がれる。
const schema = {
  ...defaultSchema,
  tagNames: [...(defaultSchema.tagNames ?? []), "figure"],
  attributes: {
    ...defaultSchema.attributes,
    img: [
      ...(defaultSchema.attributes?.img ?? []),
      "className", "loading", "decoding", "sizes", "srcSet",
      "width", "height", "fetchPriority",
    ],
    blockquote: [...(defaultSchema.attributes?.blockquote ?? []), "className", "data*"],
    a: [...(defaultSchema.attributes?.a ?? []), "className"],
    code: [
      ...(defaultSchema.attributes?.code ?? []),
      "className", "style", "data*", "tabindex",
    ],
    pre: [
      ...(defaultSchema.attributes?.pre ?? []),
      "className", "style", "data*", "tabindex",
    ],
    span: [
      ...(defaultSchema.attributes?.span ?? []),
      "className", "style", "data*",
    ],
    figure: ["className", "data*"],
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

/** LCP 画像の preload 用情報 */
export type LcpImageHint = {
  src: string;
  srcSet?: string;
  sizes?: string;
} | null;

// 画像サイズのインメモリキャッシュ（同一プロセス内で使い回す）
const sizeCache = new Map<string, { width: number; height: number }>();

/** リモート画像の実サイズを取得する（キャッシュ付き） */
async function probeImageSize(
  src: string
): Promise<{ width: number; height: number } | null> {
  if (sizeCache.has(src)) return sizeCache.get(src)!;
  try {
    const result = await probe(src, { timeout: 5000 });
    const size = { width: result.width, height: result.height };
    sizeCache.set(src, size);
    return size;
  } catch {
    // タイムアウトやネットワークエラー → フォールバック
    return null;
  }
}

/** img 要素の情報を一旦収集するための型 */
type ImageNodeInfo = {
  node: Element;
  originalSrc: string;
  isFirst: boolean;
  optimizable: boolean;
};

/** img タグに lazy loading + Next.js 画像最適化を適用する rehype プラグイン（同期パス） */
function rehypeCollectImages(
  lcpHintRef: { current: LcpImageHint },
  collectedImages: ImageNodeInfo[]
) {
  return (tree: Root) => {
    let isFirstImage = true;

    visit(tree, "element", (node: Element) => {
      if (node.tagName !== "img") return;

      const src = node.properties?.src;
      if (typeof src !== "string" || !src) return;

      const isFirst = isFirstImage;
      if (isFirstImage) isFirstImage = false;

      const optimizable = isOptimizable(src);

      // 画像情報を収集（サイズは後で非同期に解決する）
      collectedImages.push({ node, originalSrc: src, isFirst, optimizable });

      if (isFirst) {
        node.properties.loading = "eager";
        node.properties.fetchPriority = "high";
        node.properties.decoding = "auto";
      } else {
        node.properties.loading = "lazy";
        node.properties.decoding = "async";
      }

      // Next.js 画像最適化（対象ホストのみ）
      if (optimizable) {
        const srcset = RESPONSIVE_WIDTHS
          .map((w) => `${nextImageUrl(src, w)} ${w}w`)
          .join(", ");
        node.properties.srcSet = srcset;
        node.properties.sizes = "(max-width: 640px) 100vw, 828px";
        node.properties.src = nextImageUrl(src, 828);
        // CLS 防止: 元画像サイズ (282px 等) で場所を確保すると
        // レスポンシブ表示サイズ (container 幅) との差で CLS が発生する。
        // .responsive-img で width:100%;height:auto を当てて container 幅で確保。
        node.properties.className = [
          ...((node.properties.className as string[]) ?? []),
          "responsive-img",
        ];

        if (!lcpHintRef.current) {
          lcpHintRef.current = {
            src: node.properties.src as string,
            srcSet: srcset,
            sizes: "(max-width: 640px) 100vw, 828px",
          };
        }
      } else if (!lcpHintRef.current) {
        lcpHintRef.current = { src };
      }
    });
  };
}

/** 収集した画像に実サイズを非同期でセットする */
async function resolveImageSizes(images: ImageNodeInfo[]): Promise<void> {
  // optimizable 画像は CSS width:100% で表示されるため、
  // HTML の width/height を表示想定幅にスケールしてブラウザに正しい
  // アスペクト比で場所を確保させる（CLS 防止）
  const DISPLAY_WIDTH = 828;
  const FALLBACK_WIDTH = 828;
  const FALLBACK_HEIGHT = 466;

  await Promise.all(
    images.map(async ({ node, originalSrc, optimizable }) => {
      const size = await probeImageSize(originalSrc);
      if (size) {
        if (optimizable) {
          // 表示幅に合わせてスケール — アスペクト比は維持
          const scale = DISPLAY_WIDTH / size.width;
          node.properties.width = DISPLAY_WIDTH;
          node.properties.height = Math.round(size.height * scale);
        } else {
          node.properties.width = size.width;
          node.properties.height = size.height;
        }
      } else {
        if (!node.properties.width) node.properties.width = FALLBACK_WIDTH;
        if (!node.properties.height) node.properties.height = FALLBACK_HEIGHT;
      }
    })
  );
}

/** markdown 文字列を sanitize 済み HTML + LCP 画像ヒントに変換する（サーバー専用） */
export async function renderMarkdown(
  md: string
): Promise<{ html: string; lcpImageHint: LcpImageHint }> {
  const lcpHintRef: { current: LcpImageHint } = { current: null };
  const collectedImages: ImageNodeInfo[] = [];

  const processor = unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkForceLineNumbers)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeRaw)
    // shiki によるハイライト。sanitize の前に置くことで、user の生 HTML を
    // 一度 sanitize に通してから出力できる (順序は安全側に倒す)。
    .use(rehypePrettyCode, prettyCodeOptions)
    .use(rehypeSanitize, schema)
    .use(() => rehypeCollectImages(lcpHintRef, collectedImages))
    .use(rehypeStringify);

  // parse → run で AST 変換まで実行（stringify はまだ）
  const tree = processor.parse(md);
  const hast = await processor.run(tree);

  // 収集した画像の実サイズを並列で取得してから stringify
  if (collectedImages.length > 0) {
    await resolveImageSizes(collectedImages);
  }

  const html = processor.stringify(hast);
  return { html: String(html), lcpImageHint: lcpHintRef.current };
}

/**
 * 記事ごとに永続キャッシュ付きで Markdown をレンダリングする。
 *
 * Cache key には slug と updatedAt(ISO) が含まれるので、記事更新時は自動で
 * 新しいキーになり再計算される（古いキーのキャッシュは放置）。
 * tag "markdown" を付けてあるので、必要なら revalidateTag("markdown") で全破棄可能。
 *
 * - 軽量パスなら remark/rehype のパース・シリアライズをスキップ
 * - 重いパス（probe-image-size の HTTP 往復）も完全に省略
 */
const renderMarkdownCachedInner = unstable_cache(
  async (_slug: string, _updatedAtIso: string, md: string) =>
    renderMarkdown(md),
  // shiki 導入で出力 HTML が変わるので、suffix を bump して全記事を自動再生成させる。
  ["render-markdown", "v2-shiki"],
  { revalidate: false, tags: ["markdown"] }
);

export function renderMarkdownCached(
  slug: string,
  updatedAt: Date,
  md: string
) {
  return renderMarkdownCachedInner(slug, updatedAt.toISOString(), md);
}
