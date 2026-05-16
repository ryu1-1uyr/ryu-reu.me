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
    .replace(/[^a-z0-9぀-ゟ゠-ヿ一-龯]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return `${base}-${Date.now()}`;
}
