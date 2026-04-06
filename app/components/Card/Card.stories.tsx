import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { FaXTwitter, FaGithub } from "react-icons/fa6";
import Card from "./Card";

const meta: Meta<typeof Card> = {
  title: "Components/Card",
  component: Card,
  parameters: {
    layout: "padded",
  },
  tags: ["autodocs"],
  argTypes: {
    children: { control: false },
  },
};

export default meta;
type Story = StoryObj<typeof Card>;

export const Emoji: Story = {
  args: {
    children: "🎮",
    label: "ゲーム",
  },
};

export const GitHub: Story = {
  args: {
    children: (
      <div className="bg-illustration-secondary/50">
        <FaGithub />
      </div>
    ),
    label: "GitHub",
    url: "",
  },
};
