import { describe, it, expect, beforeEach } from "vitest";
import {
  loadResidentMemory,
  saveResidentMemory,
  recordVisit,
  recordInteraction,
  resetVisitCacheForTest,
  STORAGE_KEY,
  VISIT_GAP_MS,
  type StorageLike,
} from "./residentMemory";

function makeStorage(): StorageLike {
  const map = new Map<string, string>();
  return {
    getItem: (key) => map.get(key) ?? null,
    setItem: (key, value) => {
      map.set(key, value);
    },
  };
}

describe("residentMemory", () => {
  beforeEach(() => {
    resetVisitCacheForTest();
  });

  it("初訪問では previous が null で visitCount 1 の記憶を保存する", () => {
    const storage = makeStorage();
    const info = recordVisit(1000, storage);
    expect(info.previous).toBeNull();
    expect(info.current).toEqual({
      version: 1,
      firstVisitAt: 1000,
      lastVisitAt: 1000,
      visitCount: 1,
      hopCount: 0,
      throwCount: 0,
    });
    expect(loadResidentMemory(storage)).toEqual(info.current);
  });

  it("VISIT_GAP_MS 未満の再訪では visitCount は据え置かれ lastVisitAt のみ更新される", () => {
    const storage = makeStorage();
    recordVisit(1000, storage);
    resetVisitCacheForTest();

    const info = recordVisit(1000 + VISIT_GAP_MS - 1, storage);
    expect(info.previous?.visitCount).toBe(1);
    expect(info.previous?.lastVisitAt).toBe(1000);
    expect(info.current.visitCount).toBe(1);
    expect(info.current.lastVisitAt).toBe(1000 + VISIT_GAP_MS - 1);
  });

  it("VISIT_GAP_MS 以上の再訪では visitCount が増える", () => {
    const storage = makeStorage();
    recordVisit(1000, storage);
    resetVisitCacheForTest();

    const info = recordVisit(1000 + VISIT_GAP_MS, storage);
    expect(info.previous?.visitCount).toBe(1);
    expect(info.current.visitCount).toBe(2);
  });

  it("同一ページロード中の 2 回目の recordVisit はキャッシュを返し、visitCount が二重加算されない", () => {
    const storage = makeStorage();
    const first = recordVisit(1000, storage);
    const second = recordVisit(1000 + VISIT_GAP_MS, storage);

    expect(second).toBe(first);
    expect(second.current.visitCount).toBe(1);
  });

  it("壊れた JSON は null 扱いとなり、次の記録では新規訪問として作り直される", () => {
    const storage = makeStorage();
    storage.setItem(STORAGE_KEY, "{not json");

    expect(loadResidentMemory(storage)).toBeNull();

    const info = recordVisit(2000, storage);
    expect(info.previous).toBeNull();
    expect(info.current.visitCount).toBe(1);
  });

  it("version が異なるデータは null 扱いとなる", () => {
    const storage = makeStorage();
    storage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        version: 2,
        firstVisitAt: 0,
        lastVisitAt: 0,
        visitCount: 1,
        hopCount: 0,
        throwCount: 0,
      }),
    );

    expect(loadResidentMemory(storage)).toBeNull();
  });

  it("recordInteraction(hop) は hopCount を増やす", () => {
    const storage = makeStorage();
    recordVisit(1000, storage);

    recordInteraction("hop", storage);
    recordInteraction("hop", storage);

    expect(loadResidentMemory(storage)?.hopCount).toBe(2);
  });

  it("recordInteraction(throw) は throwCount を増やす", () => {
    const storage = makeStorage();
    recordVisit(1000, storage);

    recordInteraction("throw", storage);

    expect(loadResidentMemory(storage)?.throwCount).toBe(1);
  });

  it("記憶がない状態で recordInteraction を呼んでも何もしない", () => {
    const storage = makeStorage();

    expect(() => recordInteraction("hop", storage)).not.toThrow();
    expect(loadResidentMemory(storage)).toBeNull();
  });

  it("storage が null でも throw しない", () => {
    expect(() => recordVisit(1000, null)).not.toThrow();
    expect(() => recordInteraction("hop", null)).not.toThrow();
    expect(loadResidentMemory(null)).toBeNull();
    expect(() =>
      saveResidentMemory(
        {
          version: 1,
          firstVisitAt: 0,
          lastVisitAt: 0,
          visitCount: 1,
          hopCount: 0,
          throwCount: 0,
        },
        null,
      ),
    ).not.toThrow();
  });
});
