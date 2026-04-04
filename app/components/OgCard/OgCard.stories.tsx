import type { Meta, StoryObj } from "@storybook/react";
import { OgCard } from "./OgCard";

const meta = {
  title: "Components/OgCard",
  component: OgCard,
  decorators: [
    (Story) => (
      <div
        style={{
          width: 1200,
          height: 630,
          position: "relative",
          overflow: "hidden",
        }}
      >
        <Story />
      </div>
    ),
  ],
  parameters: {
    layout: "centered",
  },
} satisfies Meta<typeof OgCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const TitleOnly: Story = {
  args: {
    title: "Next.js で作るリアルタイム空模様アニメーション",
    description:
      "Canvas API と requestAnimationFrame を使って、雨・雲・雷エフェクトをゼロから実装した記録です。天気APIと連携して実際の気象データをリアルタイムに反映させています。",
  },
};

export const WithThumbnail: Story = {
  args: {
    title: "Canvas API で描く雨・雲・雷エフェクト",
    description:
      "Canvas API と requestAnimationFrame を使って、雨・雲・雷エフェクトをゼロから実装した記録です。天気APIと連携して実際の気象データをリアルタイムに反映させています。",
    thumbnailUrl:
      "https://www.fancy-fukuya.co.jp/mgr/wp-content/uploads/2025/05/20cfce153c6dcbd30dc35695758066ae.png",
  },
};

export const LongTitle: Story = {
  args: {
    title:
      "めちゃくちゃ長いタイトルのブログ記事を書いたらOGP画像がどんな感じになるか気になったので実際に確認してみたログです。どうなるんだろうね〜",
    description:
      "タイトルが長すぎるとタイトルバーに収まらなくなるので、overflow hidden + nowrap で対応しています。",
  },
};

export const SiteFallback: Story = {
  args: {
    title: "りゆうの実験場",
    description: "なんかブログとか",
  },
};
