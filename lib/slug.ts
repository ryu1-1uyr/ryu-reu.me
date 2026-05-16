/**
 * 記事タイトルから URL slug を生成する。
 *
 * - 英数字 + ひらがな + カタカナ + 漢字を残し、それ以外はハイフン区切り
 * - 前後のハイフン除去 + 60 文字に丸める
 * - 末尾に Date.now() を付与して一意性担保（同じタイトルでも被らない）
 *
 * Next.js の x-next-cache-tags ヘッダーが ASCII 外文字で 500 を出すので、
 * 日本語スラッグの場合は Vercel Deploy Hook での再ビルドが必要。
 */
export function generateSlug(title: string): string {
  const base = title
    .toLowerCase()
    // ひらがな(U+3040-U+309F) + カタカナ(U+30A0-U+30FF) + CJK統合漢字(U+4E00-U+9FAF)
    .replace(/[^a-z0-9\u3040-\u309f\u30a0-\u30ff\u4e00-\u9faf]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return `${base}-${Date.now()}`;
}
