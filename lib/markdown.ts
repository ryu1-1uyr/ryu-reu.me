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
import probe from "probe-image-size";

// rehype-sanitize は hast (HTML AST) のプロパティ名を使う
// HTML の class → hast では className、data-* → data* で一括許可
const schema = {
  ...defaultSchema,
  attributes: {
    ...defaultSchema.attributes,
    img: [
      ...(defaultSchema.attributes?.img ?? []),
      "className", "loading", "decoding", "sizes", "srcSet",
      "width", "height", "fetchPriority",
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

      // 画像情報を収集（サイズは後で非同期に解決する）
      collectedImages.push({ node, originalSrc: src, isFirst });

      if (isFirst) {
        node.properties.loading = "eager";
        node.properties.fetchPriority = "high";
        node.properties.decoding = "auto";
      } else {
        node.properties.loading = "lazy";
        node.properties.decoding = "async";
      }

      // Next.js 画像最適化（対象ホストのみ）
      if (isOptimizable(src)) {
        const srcset = RESPONSIVE_WIDTHS
          .map((w) => `${nextImageUrl(src, w)} ${w}w`)
          .join(", ");
        node.properties.srcSet = srcset;
        node.properties.sizes = "(max-width: 640px) 100vw, 828px";
        node.properties.src = nextImageUrl(src, 828);

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
  const FALLBACK_WIDTH = 828;
  const FALLBACK_HEIGHT = 466;

  await Promise.all(
    images.map(async ({ node, originalSrc }) => {
      const size = await probeImageSize(originalSrc);
      if (size) {
        node.properties.width = size.width;
        node.properties.height = size.height;
      } else {
        // probe 失敗時のみフォールバック
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
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeRaw)
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
