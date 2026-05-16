/**
 * 記事作成・更新 API の request body バリデーション。
 *
 * 軽量な手書き型ガード。各フィールドを typeof / Array.isArray で実行時検証して、
 * 通れば型付きの値を、ダメなら `{ error }` を返す。
 *
 * 呼び出し側: `if ("error" in result) return 400;` で分岐
 */

export type CreatePostBody = {
  title: string;
  content: string;
  published?: boolean;
  tags?: string[];
  ogImage?: string | null;
};

export type UpdatePostBody = CreatePostBody;

type ValidationError = { error: string };

function isStringArray(v: unknown): v is string[] {
  return Array.isArray(v) && v.every((x) => typeof x === "string");
}

function parsePostBody(raw: unknown): CreatePostBody | ValidationError {
  if (typeof raw !== "object" || raw === null) {
    return { error: "body must be a JSON object" };
  }
  const r = raw as Record<string, unknown>;

  if (typeof r.title !== "string" || !r.title) {
    return { error: "title is required" };
  }
  if (typeof r.content !== "string" || !r.content) {
    return { error: "content is required" };
  }
  if (r.published !== undefined && typeof r.published !== "boolean") {
    return { error: "published must be boolean" };
  }
  if (r.tags !== undefined && !isStringArray(r.tags)) {
    return { error: "tags must be string[]" };
  }
  if (
    r.ogImage !== undefined &&
    r.ogImage !== null &&
    typeof r.ogImage !== "string"
  ) {
    return { error: "ogImage must be string | null" };
  }

  return {
    title: r.title,
    content: r.content,
    published: r.published as boolean | undefined,
    tags: r.tags as string[] | undefined,
    ogImage: r.ogImage as string | null | undefined,
  };
}

export const parseCreatePostBody = parsePostBody;
export const parseUpdatePostBody = parsePostBody;
