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
