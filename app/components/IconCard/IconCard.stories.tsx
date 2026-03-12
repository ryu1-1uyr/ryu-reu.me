import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { FaXTwitter, FaYoutube, FaGithub, FaDiscord } from "react-icons/fa6";
import { SiPixiv, SiSteam } from "react-icons/si";
import IconCard from "./IconCard";

const meta: Meta<typeof IconCard> = {
  title: "Components/IconCard",
  component: IconCard,
  parameters: {
    layout: "padded",
  },
  tags: ["autodocs"],
  argTypes: {
    // ReactNode は Storybook の Controls で編集できないため無効化
    icon: { control: false },
  },
};

export default meta;
type Story = StoryObj<typeof IconCard>;

export const Twitter: Story = {
  args: {
    icon: <FaXTwitter />,
    label: "X",
    url: "",
  },
};

export const YouTube: Story = {
  args: {
    icon: <FaYoutube />,
    label: "YouTube",
    url: "",
  },
};

export const Discord: Story = {
  args: {
    icon: <FaDiscord />,
    label: "Discord",
    url: "",
  },
};

export const Steam: Story = {
  args: {
    icon: <SiSteam />,
    label: "Steam",
    url: "",
  },
};

export const GitHub: Story = {
  args: {
    icon: <FaGithub />,
    label: "GitHub",
    url: "",
  },
};

export const Pixiv: Story = {
  args: {
    icon: <SiPixiv />,
    label: "pixiv",
    url: "",
  },
};
