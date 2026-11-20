// 直近に押したリンクの矩形 (カードがあればカード全体)。
// ページ遷移で、新しいページを「押した場所から開く」ために使う

export type NavRect = { x: number; y: number; width: number; height: number };

let lastOrigin: (NavRect & { at: number }) | null = null;

/** 遷移とみなす猶予。遅い回線での読み込み待ちも含めて余裕を持たせる */
const MAX_AGE_MS = 10000;

export function recordNavOrigin(rect: NavRect) {
  lastOrigin = { ...rect, at: Date.now() };
}

export function clearNavOrigin() {
  lastOrigin = null;
}

export function getNavOrigin(): NavRect | null {
  if (!lastOrigin || Date.now() - lastOrigin.at > MAX_AGE_MS) return null;
  const { x, y, width, height } = lastOrigin;
  return { x, y, width, height };
}
