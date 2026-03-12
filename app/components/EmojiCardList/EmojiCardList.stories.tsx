import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import EmojiCardList from "./EmojiCardList";

const meta: Meta<typeof EmojiCardList> = {
  title: "Components/EmojiCardList",
  component: EmojiCardList,
  parameters: {
    layout: "padded",
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof EmojiCardList>;

const ALL_ITEMS = [
  { emoji: "🎮", label: "ゲーム" },
  { emoji: "💻", label: "開発" },
  { emoji: "🎧", label: "音楽" },
  { emoji: "🎹", label: "作曲" },
  { emoji: "🎨", label: "お絵描き" },
];

export const Default: Story = {
  args: {
    items: ALL_ITEMS,
  },
};

export const Single: Story = {
  args: {
    items: [{ emoji: "🎮", label: "ゲーム" }],
  },
};

export const Empty: Story = {
  args: {
    items: [],
  },
};
