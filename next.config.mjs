/** @type {import('next').NextConfig} */
const nextConfig = {
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
