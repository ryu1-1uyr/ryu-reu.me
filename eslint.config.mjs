import coreWebVitals from "eslint-config-next/core-web-vitals";

const config = [
  {
    ignores: [
      "storybook-static/**",
      "app/generated/**",
      ".claude/**",
    ],
  },
  ...coreWebVitals,
];

export default config;
