import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import ShareButtons from "./ShareButtons";

const meta: Meta<typeof ShareButtons> = {
  title: "Components/ShareButtons",
  component: ShareButtons,
  parameters: {
    layout: "padded",
    nextjs: {
      appDirectory: true,
    },
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof ShareButtons>;

export const Default: Story = {
  args: {
    title: "Next.jsで作るブログ",
    slug: "nextjs-blog-post",
  },
};
