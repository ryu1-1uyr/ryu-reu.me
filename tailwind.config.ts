import type { Config } from "tailwindcss";
import plugin from "tailwindcss/plugin";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
      keyframes: {
        "loading-bar": {
          "0%": { transform: "translateX(-100%)", width: "40%" },
          "50%": { transform: "translateX(60%)", width: "60%" },
          "100%": { transform: "translateX(250%)", width: "40%" },
        },
      },
      animation: {
        "loading-bar": "loading-bar 1.5s ease-in-out infinite",
      },
      colors: {
        elements: {
          background: "#232946",
          headline: "#fffffe",
          paragraph: "#b8c1ec",
          button: "#eebbc3",
          "button-text": "#232946",
        },
        illustration: {
          stroke: "#121629",
          main: "#b8c1ec",
          highlight: "#eebbc3",
          secondary: "#fffffe",
          tertiary: "#eebbc3",
        },
      },
    },
  },
  plugins: [
    require("@tailwindcss/typography"),
    // `prose-mobile-tuned` クラス: スマホ (~767px) のときだけ prose を読みやすく調整。
    //   <article className="prose prose-neutral prose-mobile-tuned max-w-none">
    // 内容:
    // - 見出し (h1/h2/h3) を縮小して改行を抑える
    // - リスト要素の上下マージンを詰める
    // - テーブルは横スクロール + セル内は改行禁止
    //
    // typography プラグインの `theme.typography['mobile-tuned'].css` 経由で
    // 書くと、内部の :where() ネスト処理で @media が剥がれて全画面サイズに
    // 適用されちゃう挙動だったので、addComponents で直接 @media を書く。
    plugin(({ addComponents }) => {
      addComponents({
        "@media (max-width: 767px)": {
          // ベースの font-size を下げて全体をスケールダウン。
          // 子要素 (h1/h2/h3 等) はこの 14.4px を基準に em で相対指定。
          ".prose-mobile-tuned": {
            fontSize: "0.9em", // ≒ 14.4px (16 * 0.9)
          },
          ".prose-mobile-tuned h1": { fontSize: "1.222em", lineHeight: "1.3" }, // ≒ 17.6px (1.1em from 16)
          ".prose-mobile-tuned h2": { fontSize: "1.111em", lineHeight: "1.35" }, // ≒ 16px
          ".prose-mobile-tuned h3": { fontSize: "1.05em", lineHeight: "1.4" }, // ≒ 15.1px
          ".prose-mobile-tuned ul > li, .prose-mobile-tuned ol > li": {
            marginTop: "0.2em",
            marginBottom: "0.2em",
            paddingInlineStart: "0",
          },
          // table は本文と同じ 14.4px で継承 (個別 fontSize 指定なし)
          ".prose-mobile-tuned table": {
            display: "block",
            overflowX: "auto",
          },
          ".prose-mobile-tuned thead th, .prose-mobile-tuned tbody td": {
            whiteSpace: "nowrap",
          },
        },
      });
    }),
  ],
};
export default config;

// Elements

// ┌─────────────────────┬───────────────────────────────────────────────────┐
// │        用途         │                     クラス例                      │
// ├─────────────────────┼───────────────────────────────────────────────────┤
// │ Background #232946  │ bg-elements-background / text-elements-background │
// ├─────────────────────┼───────────────────────────────────────────────────┤
// │ Headline #fffffe    │ text-elements-headline                            │
// ├─────────────────────┼───────────────────────────────────────────────────┤
// │ Paragraph #b8c1ec   │ text-elements-paragraph                           │
// ├─────────────────────┼───────────────────────────────────────────────────┤
// │ Button #eebbc3      │ bg-elements-button                                │
// ├─────────────────────┼───────────────────────────────────────────────────┤
// │ Button text #232946 │ text-elements-button-text                         │
// └─────────────────────┴───────────────────────────────────────────────────┘

// Illustration

// ┌───────────────────┬─────────────────────────────────────────────────────────┐
// │       用途        │                        クラス例                         │
// ├───────────────────┼─────────────────────────────────────────────────────────┤
// │ Stroke #121629    │ stroke-illustration-stroke / border-illustration-stroke │
// ├───────────────────┼─────────────────────────────────────────────────────────┤
// │ Main #b8c1ec      │ fill-illustration-main / text-illustration-main         │
// ├───────────────────┼─────────────────────────────────────────────────────────┤
// │ Highlight #eebbc3 │ text-illustration-highlight                             │
// ├───────────────────┼─────────────────────────────────────────────────────────┤
// │ Secondary #fffffe │ text-illustration-secondary                             │
// ├───────────────────┼─────────────────────────────────────────────────────────┤
// │ Tertiary #eebbc3  │ text-illustration-tertiary                              │
// └───────────────────┴─────────────────────────────────────────────────────────┘

// bg-・text-・border-・fill-・stroke- など Tailwind の全ユーティリティで共通してつかえるぞ！
