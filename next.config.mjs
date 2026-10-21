const isDev = process.env.NODE_ENV === "development";

// nonce 方式は全ページが dynamic rendering になり SSG/ISR が効かなくなるため、
// script-src は 'unsafe-inline' を許容し、それ以外のディレクティブで防御する。
// 'unsafe-eval' と ws: は dev の HMR / React のデバッグ機能用。
const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""} https://platform.twitter.com https://va.vercel-scripts.com`,
  "style-src 'self' 'unsafe-inline'",
  // 記事中の画像は Supabase Storage 以外の外部 URL もありうるため https: を広く許可
  "img-src 'self' data: blob: https:",
  "font-src 'self'",
  `connect-src 'self' https://*.supabase.co wss://*.supabase.co https://va.vercel-scripts.com${isDev ? " ws:" : ""}`,
  "frame-src https://platform.twitter.com https://syndication.twitter.com",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  ...(isDev ? [] : ["upgrade-insecure-requests"]),
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  // React Compiler を有効化。useMemo/useCallback/React.memo の手動メモ化を
  // 自動化してくれる。既存の手動メモ化はそのまま尊重されるので非破壊で導入可能。
  // Next.js は SWC で対象ファイル (JSX/Hook 含むやつ) だけ Babel に通すので
  // ビルド時間への影響は最小。
  reactCompiler: true,
  experimental: {
    inlineCss: true,
    // クライアント側 Router Cache の保持時間。
    // デフォルトは dynamic=0 / static=300 だが、トップは AboutMe で cookies()
    // を使ってる関係で Dynamic 扱いとなり、戻る/進む時に毎回 RSC 再取得が走る。
    // 60秒 cache すれば戻るボタン押下で即復元できる。
    staleTimes: {
      dynamic: 60,
      static: 300,
    },
  },
  outputFileTracingIncludes: {
    "/api/**/*": ["./node_modules/.prisma/client/**/*"],
    "/*": ["./node_modules/.prisma/client/**/*"],
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

export default nextConfig;
