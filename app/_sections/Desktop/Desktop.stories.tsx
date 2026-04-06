import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import Desktop from "./Desktop";

const meta: Meta<typeof Desktop> = {
  title: "Sections/Desktop",
  component: Desktop,
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof Desktop>;

export const Default: Story = {
  args: {
    contents: {
      "about-me": (
        <div className="p-4 text-sm text-elements-headline">
          About Me の中身
        </div>
      ),
      "recent-posts": (
        <div className="p-4 text-sm text-elements-headline">
          記事一覧の中身
        </div>
      ),
    },
  },
};
