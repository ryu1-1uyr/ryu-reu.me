/**
 * 記事作成・更新 API の request body バリデーション。
 *
 * 軽量な手書き型ガード。各フィールドを typeof / Array.isArray で実行時検証して、
 * 通れば `{ ok: true, data }` を、ダメなら `{ ok: false, error }` を返す。
 * Discriminated union なので、呼び出し側は `if (!result.ok)` で安全に分岐できる
 * (将来 data 側のフィールドに `error` が追加されても型レベルで衝突しない)。
 *
 * 現状 POST/PUT は同じ全フィールド書き換え仕様なので `parsePostBody` 1 本で扱う。
 * 部分更新 (PATCH) を入れる時に分岐させる前提。
 */

export type PostBody = {
  title: string;
  content: string;
  published?: boolean;
  tags?: string[];
  ogImage?: string | null;
};

export type ParseResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

function isStringArray(v: unknown): v is string[] {
  return Array.isArray(v) && v.every((x) => typeof x === "string");
}

export function parsePostBody(raw: unknown): ParseResult<PostBody> {
  if (typeof raw !== "object" || raw === null) {
    return { ok: false, error: "body must be a JSON object" };
  }
  const r = raw as Record<string, unknown>;

  if (typeof r.title !== "string" || !r.title) {
    return { ok: false, error: "title is required" };
  }
  if (typeof r.content !== "string" || !r.content) {
    return { ok: false, error: "content is required" };
  }
  if (r.published !== undefined && typeof r.published !== "boolean") {
    return { ok: false, error: "published must be boolean" };
  }
  if (r.tags !== undefined && !isStringArray(r.tags)) {
    return { ok: false, error: "tags must be string[]" };
  }
  if (
    r.ogImage !== undefined &&
    r.ogImage !== null &&
    typeof r.ogImage !== "string"
  ) {
    return { ok: false, error: "ogImage must be string | null" };
  }

  return {
    ok: true,
    data: {
      title: r.title,
      content: r.content,
      published: r.published as boolean | undefined,
      tags: r.tags as string[] | undefined,
      ogImage: r.ogImage as string | null | undefined,
    },
  };
}
