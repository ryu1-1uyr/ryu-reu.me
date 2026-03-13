import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import PostCard from "./PostCard";

const meta: Meta<typeof PostCard> = {
  title: "Components/PostCard",
  component: PostCard,
  parameters: {
    layout: "padded",
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof PostCard>;

export const Default: Story = {
  args: {
    title: "Next.jsとSupabaseで作るフルスタックアプリ",
    id: "nextjs-supabase-fullstack",
    authorEmail: "author@example.com",
    createdAt: new Date("2026-03-01"),
    content:
      "Next.jsとSupabaseを組み合わせることで、型安全なフルスタックアプリを素早く構築できます。この記事では基本的なセットアップから実際の開発手順まで解説します。",
  },
};

export const LongContent: Story = {
  args: {
    title: "長い本文のサンプル",
    id: "long-content-sample",
    authorEmail: "writer@example.com",
    createdAt: new Date("2026-02-15"),
    content:
      "これは非常に長い本文のサンプルです。".repeat(10),
  },
};

export const ShortContent: Story = {
  args: {
    title: "短い投稿",
    id: "short-post",
    authorEmail: "user@example.com",
    createdAt: new Date("2026-03-05"),
    content: "短い内容の投稿です。",
  },
};
