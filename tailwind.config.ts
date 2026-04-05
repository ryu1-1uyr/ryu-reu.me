import type { Config } from "tailwindcss";

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
        // A: ふわっと真上にゆっくり昇天
        "fly-to-sky-straight": {
          "0%": {
            transform: "translate(0, 0) scale(1)",
            opacity: "1",
            animationTimingFunction: "ease-out",
          },
          "20%": { transform: "translate(0, -15vh) scale(0.85)", opacity: "1" },
          "65%": {
            transform: "translate(0, -60vh) scale(0.5)",
            opacity: "0.7",
            animationTimingFunction: "ease-in",
          },
          "100%": {
            transform: "translate(0, -105vh) scale(0.15)",
            opacity: "0",
          },
        },
        // B: 左の弧を描きながらゆっくり流れる
        "fly-to-sky-left": {
          "0%": {
            transform: "translate(0, 0) scale(1) rotate(0deg)",
            opacity: "1",
            animationTimingFunction: "ease-out",
          },
          "20%": {
            transform: "translate(-4vw, -18vh) scale(0.85) rotate(-4deg)",
            opacity: "1",
          },
          "55%": {
            transform: "translate(-18vw, -55vh) scale(0.52) rotate(-12deg)",
            opacity: "0.7",
            animationTimingFunction: "ease-in",
          },
          "100%": {
            transform: "translate(-32vw, -105vh) scale(0.15) rotate(-22deg)",
            opacity: "0",
          },
        },
        // ローディングバー: 左から右に繰り返し流れる
        "loading-bar": {
          "0%": { transform: "translateX(-100%)", width: "40%" },
          "50%": { transform: "translateX(60%)", width: "60%" },
          "100%": { transform: "translateX(250%)", width: "40%" },
        },
        // C: 右にゆっくりふわりと流れる
        "fly-to-sky-right": {
          "0%": {
            transform: "translate(0, 0) scale(1) rotate(0deg)",
            opacity: "1",
          },
          "20%": {
            transform: "translate(4vw, -15vh) scale(0.85) rotate(4deg)",
            opacity: "1",
            animationTimingFunction: "ease-out",
          },
          "55%": {
            transform: "translate(14vw, -52vh) scale(0.52) rotate(11deg)",
            opacity: "0.7",
          },
          "100%": {
            transform: "translate(24vw, -105vh) scale(0.15) rotate(20deg)",
            opacity: "0",
            animationTimingFunction: "ease-in",
          },
        },
      },
      animation: {
        "fly-to-sky-straight":
          "fly-to-sky-straight 2.2s cubic-bezier(0.37,0,0.63,1) forwards",
        "fly-to-sky-left":
          "fly-to-sky-left 2.4s cubic-bezier(0.37,0,0.63,1) forwards",
        "fly-to-sky-right":
          "fly-to-sky-right 2.2s cubic-bezier(0.37,0,0.63,1) forwards",
        "loading-bar":
          "loading-bar 1.5s ease-in-out infinite",
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
  plugins: [require("@tailwindcss/typography")],
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
