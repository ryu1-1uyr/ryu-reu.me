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

export const env = {
  get SUPABASE_URL(): string {
    const v = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!v) {
      throw new Error(
        "Missing required environment variable: NEXT_PUBLIC_SUPABASE_URL"
      );
    }
    return v;
  },
  get SUPABASE_ANON_KEY(): string {
    const v = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!v) {
      throw new Error(
        "Missing required environment variable: NEXT_PUBLIC_SUPABASE_ANON_KEY"
      );
    }
    return v;
  },
};

export const IS_DEV = process.env.NODE_ENV === "development";
