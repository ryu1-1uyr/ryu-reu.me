import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import React from "react";
import PageTransition from "./PageTransition";

const meta: Meta<typeof PageTransition> = {
  title: "Components/PageTransition",
  component: PageTransition,
  parameters: {
    layout: "padded",
  },
  tags: ["autodocs"],
  argTypes: {
    // ReactNode は Controls で編集できないため無効化
    children: { control: false },
  },
};

export default meta;
type Story = StoryObj<typeof PageTransition>;

// 入場アニメーション確認用: シンプルなカード
export const Default: Story = {
  render: () => (
    <PageTransition>
      <div className="bg-illustration-stroke rounded-xl p-8 text-elements-headline text-xl font-bold">
        ページコンテンツ（フェードイン・スライド・ブラー）
      </div>
    </PageTransition>
  ),
};

// 記事詳細ページを想定したレイアウト
export const ArticleLayout: Story = {
  render: () => (
    <PageTransition>
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <p className="text-elements-paragraph text-sm">← トップへ戻る</p>
        </div>
        <h1 className="text-3xl font-bold mb-4 text-elements-headline">
          Next.jsとSupabaseで作るフルスタックアプリ
        </h1>
        <div className="text-sm text-elements-paragraph mb-8 space-y-1">
          <p>作成日: 2026/3/13</p>
          <p>更新日: 2026/3/13</p>
        </div>
        <article className="bg-elements-headline rounded-lg p-8 space-y-3">
          <p className="text-illustration-stroke">
            Next.jsとSupabaseを組み合わせることで、型安全なフルスタックアプリを素早く構築できます。
          </p>
          <p className="text-illustration-stroke">
            この記事では基本的なセットアップから実際の開発手順まで解説します。
          </p>
        </article>
      </div>
    </PageTransition>
  ),
};

// テキストのみのシンプルなコンテンツ
export const WithText: Story = {
  render: () => (
    <PageTransition>
      <p className="text-elements-paragraph">
        アニメーションはページ読み込み時に自動で再生されます。
        Storybookでページを切り替えるたびに確認できます。
      </p>
    </PageTransition>
  ),
};
