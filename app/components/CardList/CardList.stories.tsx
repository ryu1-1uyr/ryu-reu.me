import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { FaGithub, FaXTwitter, FaYoutube } from "react-icons/fa6";
import CardList from "./CardList";

const meta: Meta<typeof CardList> = {
  title: "Components/CardList",
  component: CardList,
  parameters: {
    layout: "padded",
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof CardList>;

export const Emojis: Story = {
  args: {
    items: [
      { children: "🎮", label: "ゲーム" },
      { children: "💻", label: "開発" },
      { children: "🎧", label: "音楽" },
    ],
  },
};

export const WithLinks: Story = {
  render: () => (
    <CardList
      items={[
        { children: <FaXTwitter />, label: "X", url: "" },
        { children: <FaGithub />, label: "GitHub", url: "" },
        { children: <FaYoutube />, label: "YouTube", url: "" },
      ]}
    />
  ),
};
