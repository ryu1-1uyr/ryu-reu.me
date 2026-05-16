/**
 * 環境変数を一元管理するモジュール。
 *
 * 各 getter は **lazy 評価** で、`import { env } from "@/lib/env"` した時点では
 * 何も評価されない。実際に `env.SUPABASE_URL` を参照したタイミングで初めて検証。
 *
 * NEXT_PUBLIC_* は Next.js が **ビルド時にクライアントバンドルへ inline** するが、
 * static analysis に依存しているため `process.env[key]` のような動的アクセスは
 * inline されず、ブラウザ側で undefined になる。必ず `process.env.NEXT_PUBLIC_FOO`
 * の形で **静的に書く**。
 */

function requireEnv(key: string, value: string | undefined): string {
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

export const env = {
  get SUPABASE_URL(): string {
    return requireEnv(
      "NEXT_PUBLIC_SUPABASE_URL",
      process.env.NEXT_PUBLIC_SUPABASE_URL
    );
  },
  get SUPABASE_ANON_KEY(): string {
    return requireEnv(
      "NEXT_PUBLIC_SUPABASE_ANON_KEY",
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
  },
};

export const IS_DEV = process.env.NODE_ENV === "development";
