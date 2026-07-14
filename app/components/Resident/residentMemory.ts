/**
 * デスクトップの住人（マスコット）の訪問記憶モジュール。
 * localStorage に前回訪問・累計インタラクションを保存し、挨拶リアクション判定に使う。
 * SSR・プライベートブラウジング（localStorage が例外を投げる環境）でも落ちないよう
 * ストレージアクセスはすべて try/catch し、失敗時は永続化なしで動作する。
 */

export type ResidentMemory = {
  version: 1;
  /** 初訪問時刻 (epoch ms) */
  firstVisitAt: number;
  /** 最後に訪問を記録した時刻 (epoch ms) */
  lastVisitAt: number;
  /** 訪問回数（VISIT_GAP_MS 以上空いた再訪で加算） */
  visitCount: number;
  /** クリックでつつかれた累計 */
  hopCount: number;
  /** 掴んで投げられた累計 */
  throwCount: number;
};

export const STORAGE_KEY = "resident-memory-v1";
/** これ以上間隔が空いたら「新しい訪問」とみなす (ms)。30 分 */
export const VISIT_GAP_MS = 30 * 60 * 1000;

export type VisitInfo = {
  /** 今回の訪問を記録する前の記憶。初訪問なら null */
  previous: ResidentMemory | null;
  current: ResidentMemory;
};

export type StorageLike = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
};

function defaultStorage(): StorageLike | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function isResidentMemory(value: unknown): value is ResidentMemory {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    v.version === 1 &&
    typeof v.firstVisitAt === "number" &&
    typeof v.lastVisitAt === "number" &&
    typeof v.visitCount === "number" &&
    typeof v.hopCount === "number" &&
    typeof v.throwCount === "number"
  );
}

export function loadResidentMemory(
  storage: StorageLike | null = defaultStorage(),
): ResidentMemory | null {
  if (!storage) return null;
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    return isResidentMemory(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function saveResidentMemory(
  mem: ResidentMemory,
  storage: StorageLike | null = defaultStorage(),
): void {
  if (!storage) return;
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(mem));
  } catch {
    // quota 超過などは握りつぶす（永続化は best effort）
  }
}

/** ページロード中の記録を 1 回だけに抑えるモジュールキャッシュ（住人は複数体マウントされうる） */
let visitCache: VisitInfo | null = null;

export function recordVisit(
  now: number = Date.now(),
  storage: StorageLike | null = defaultStorage(),
): VisitInfo {
  if (visitCache) return visitCache;

  const existing = loadResidentMemory(storage);
  let info: VisitInfo;
  if (!existing) {
    const current: ResidentMemory = {
      version: 1,
      firstVisitAt: now,
      lastVisitAt: now,
      visitCount: 1,
      hopCount: 0,
      throwCount: 0,
    };
    info = { previous: null, current };
  } else {
    const previous: ResidentMemory = { ...existing };
    const current: ResidentMemory = { ...existing };
    if (now - existing.lastVisitAt >= VISIT_GAP_MS) {
      current.visitCount += 1;
    }
    current.lastVisitAt = now;
    info = { previous, current };
  }

  saveResidentMemory(info.current, storage);
  visitCache = info;
  return info;
}

export function recordInteraction(
  kind: "hop" | "throw",
  storage: StorageLike | null = defaultStorage(),
): void {
  const mem = loadResidentMemory(storage);
  if (!mem) return;

  if (kind === "hop") {
    mem.hopCount += 1;
  } else {
    mem.throwCount += 1;
  }
  saveResidentMemory(mem, storage);

  if (visitCache) {
    visitCache = { ...visitCache, current: mem };
  }
}

/**
 * テスト専用: モジュールレベルの訪問キャッシュをクリアする。
 * プロダクションコードから呼ばないこと。
 */
export function resetVisitCacheForTest(): void {
  visitCache = null;
}
