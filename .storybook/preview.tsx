import type { Preview } from "@storybook/nextjs-vite";
import React from "react";
import "../app/globals.css";

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="bg-elements-background min-h-screen p-8">
        <Story />
      </div>
    ),
  ],
};

export default preview;
