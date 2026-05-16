/**
 * 環境変数を一元管理するモジュール。
 *
 * 必須の環境変数は `requireEnv` を通して読むことで、未設定なら起動時に
 * 即座に throw される（ランタイムで `undefined!` が漏れるのを防ぐ）。
 * 各ファイルで `process.env.FOO!` を散らばらせないのが目的。
 */

function requireEnv(key: string): string {
  const v = process.env[key];
  if (!v) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return v;
}

export const SUPABASE_URL = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
export const SUPABASE_ANON_KEY = requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");

export const IS_DEV = process.env.NODE_ENV === "development";
