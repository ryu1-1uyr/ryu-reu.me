import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import EmojiCard from "./EmojiCard";

const meta: Meta<typeof EmojiCard> = {
  title: "Components/EmojiCard",
  component: EmojiCard,
  parameters: {
    layout: "padded",
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof EmojiCard>;

export const Game: Story = {
  args: {
    emoji: "🎮",
    label: "ゲーム",
  },
};

export const Development: Story = {
  args: {
    emoji: "💻",
    label: "開発",
  },
};

export const Music: Story = {
  args: {
    emoji: "🎧",
    label: "音楽",
  },
};

export const Composition: Story = {
  args: {
    emoji: "🎹",
    label: "作曲",
  },
};

export const Art: Story = {
  args: {
    emoji: "🎨",
    label: "お絵描き",
  },
};
