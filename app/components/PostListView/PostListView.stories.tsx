import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import PostListView from "./PostListView";

const meta: Meta<typeof PostListView> = {
  title: "Components/PostListView",
  component: PostListView,
  parameters: {
    layout: "padded",
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof PostListView>;

const samplePosts = [
  {
    id: "1",
    title: "Next.jsとSupabaseで作るフルスタックアプリ",
    slug: "nextjs-supabase-fullstack",
    authorEmail: "author@example.com",
    createdAt: new Date("2026-03-01"),
    content:
      "Next.jsとSupabaseを組み合わせることで、型安全なフルスタックアプリを素早く構築できます。この記事では基本的なセットアップから実際の開発手順まで解説します。",
  },
  {
    id: "2",
    title: "TailwindCSSのベストプラクティス",
    slug: "tailwindcss-best-practices",
    authorEmail: "writer@example.com",
    createdAt: new Date("2026-02-20"),
    content:
      "TailwindCSSを使ったスタイリングのベストプラクティスを紹介します。コンポーネントの設計からレスポンシブ対応まで幅広く解説します。",
  },
  {
    id: "3",
    title: "Prismaで始めるORM入門",
    slug: "prisma-orm-intro",
    authorEmail: "dev@example.com",
    createdAt: new Date("2026-02-10"),
    content:
      "PrismaはTypeScriptと相性の良いORMです。スキーマ定義からマイグレーション、クエリの書き方まで基本を押さえましょう。",
  },
];

export const WithPosts: Story = {
  args: {
    posts: samplePosts,
  },
};

export const SinglePost: Story = {
  args: {
    posts: [samplePosts[0]],
  },
};

export const Empty: Story = {
  args: {
    posts: [],
  },
};
