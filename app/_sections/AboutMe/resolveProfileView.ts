import { classifyReferer } from "./refererMap";
import type { ProfileView } from "./profiles/types";

const VALID_VIEWS: readonly ProfileView[] = ["creator", "engineer"];
const DEFAULT_VIEW: ProfileView = "creator";

const QUERY_ALIAS: Record<string, ProfileView> = {
  creator: "creator",
  create: "creator",
  art: "creator",
  dev: "engineer",
  engineer: "engineer",
  tech: "engineer",
};

function normalizeViewInput(
  value: string | null | undefined
): ProfileView | null {
  if (!value) return null;
  const key = value.toLowerCase();
  if (QUERY_ALIAS[key]) return QUERY_ALIAS[key];
  if ((VALID_VIEWS as readonly string[]).includes(key))
    return key as ProfileView;
  return null;
}

export type ResolveProfileViewInput = {
  query?: string | null;
  cookie?: string | null;
  referer?: string | null;
};

// 優先順位: query → cookie → referer → デフォルト
export function resolveProfileView(
  input: ResolveProfileViewInput
): ProfileView {
  const queryView = normalizeViewInput(input.query);
  if (queryView) return queryView;

  const cookieView = normalizeViewInput(input.cookie);
  if (cookieView) return cookieView;

  const refererView = classifyReferer(input.referer);
  if (refererView) return refererView;

  return DEFAULT_VIEW;
}
