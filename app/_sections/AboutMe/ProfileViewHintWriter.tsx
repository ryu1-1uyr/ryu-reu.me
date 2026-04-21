"use client";

import { useEffect } from "react";
import type { ProfileView } from "./profiles/types";

// 初訪問した記事のタグから profile_view を推定するルール。
const TAG_RULES: { view: ProfileView; tags: Set<string> }[] = [
  { view: "engineer", tags: new Set(["技術", "フロントエンド"]) },
  { view: "creator", tags: new Set(["お絵描き"]) },
];

const COOKIE_MAX_AGE = 60 * 60 * 24 * 180; // 180日

function hasProfileViewCookie(): boolean {
  return /(?:^|;\s*)profile_view=/.test(document.cookie);
}

function matchRule(tags: string[]): ProfileView | null {
  for (const rule of TAG_RULES) {
    if (tags.some((t) => rule.tags.has(t))) return rule.view;
  }
  return null;
}

type Props = { tags: string[] };

// 記事ページに置いて、Cookie 未設定時のみタグから profile_view を刷り込む。
// すでに Cookie が有る（＝ホームや他記事を先に訪問済み）なら何もしない。
export default function ProfileViewHintWriter({ tags }: Props) {
  useEffect(() => {
    if (hasProfileViewCookie()) return;

    const view = matchRule(tags);
    if (!view) return;

    const secure = location.protocol === "https:" ? "; Secure" : "";
    document.cookie = `profile_view=${view}; Path=/; Max-Age=${COOKIE_MAX_AGE}; SameSite=Lax${secure}`;
  }, [tags]);

  return null;
}
