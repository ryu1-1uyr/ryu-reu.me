import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import BackButton from "./BackButton";
import { PageTransitionContext } from "@/app/components/PageTransition";

const meta: Meta<typeof BackButton> = {
  title: "Components/BackButton",
  component: BackButton,
  parameters: {
    layout: "padded",
    nextjs: {
      appDirectory: true,
    },
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof BackButton>;

// デフォルト: Context のデフォルト値 (noop startExit) で表示
export const Default: Story = {};

// ページ遷移アニメーションのモック付き: クリック時に 350ms 待機後に遷移
export const WithExitAnimation: Story = {
  decorators: [
    (Story) => (
      <PageTransitionContext.Provider
        value={{
          startExit: async () => {
            await new Promise<void>((resolve) => setTimeout(resolve, 350));
          },
        }}
      >
        <Story />
      </PageTransitionContext.Provider>
    ),
  ],
};

// 記事ページの想定レイアウト内に配置したイメージ
export const InArticleLayout: Story = {
  decorators: [
    (Story) => (
      <div className="max-w-3xl mx-auto">
        <Story />
        <h1 className="text-3xl font-bold text-elements-headline mb-4">
          記事タイトルのサンプル
        </h1>
        <p className="text-sm text-elements-paragraph">2026-03-13</p>
      </div>
    ),
  ],
};
