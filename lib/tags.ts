/**
 * タグ名配列を正規化する。
 *
 * - NFKC 正規化（全角英数字→半角、互換文字統一）
 * - 前後空白除去
 * - 空文字除外
 * - 重複除去（Set）
 *
 * POST/PUT 両方で同じロジックを使い回すため抽出。
 */
export function normalizeTags(tags: string[] | undefined): string[] {
  if (!tags) return [];
  return [
    ...new Set(tags.map((t) => t.trim().normalize("NFKC")).filter(Boolean)),
  ];
}
