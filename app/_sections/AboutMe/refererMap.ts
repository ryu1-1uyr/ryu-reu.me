import type { ProfileView } from "./profiles/types";

// ドメインを正規化（先頭 www. を除去、小文字化）
export function normalizeHost(host: string): string {
  return host.toLowerCase().replace(/^www\./, "");
}

// 完全一致・サフィックス一致（サブドメイン含む）でカテゴリを引くテーブル
const ENGINEER_HOSTS = new Set<string>([
  "github.com",
  "gist.github.com",
  "zenn.dev",
  "qiita.com",
  "stackoverflow.com",
  "stackexchange.com",
  "dev.to",
  "news.ycombinator.com",
  "speakerdeck.com",
  "connpass.com",
]);

const CREATOR_HOSTS = new Set<string>([
  "pixiv.net",
  "youtube.com",
  "youtu.be",
  "bsky.app",
  "nicovideo.jp",
  "fanbox.cc",
  "booth.pm",
  "soundcloud.com",
]);

function matchesHost(host: string, set: Set<string>): boolean {
  if (set.has(host)) return true;
  // サブドメインマッチ: "foo.github.com" → "github.com" がセットにあればヒット
  for (const known of set) {
    if (host.endsWith(`.${known}`)) return true;
  }
  return false;
}

// Referer 文字列（URL）からカテゴリを推定。該当なしなら null。
export function classifyReferer(referer: string | null | undefined): ProfileView | null {
  if (!referer) return null;
  let host: string;
  try {
    host = normalizeHost(new URL(referer).hostname);
  } catch {
    return null;
  }
  if (matchesHost(host, ENGINEER_HOSTS)) return "engineer";
  if (matchesHost(host, CREATOR_HOSTS)) return "creator";
  return null;
}
