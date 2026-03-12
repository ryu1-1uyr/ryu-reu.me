import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { FaXTwitter, FaYoutube, FaGithub, FaDiscord } from "react-icons/fa6";
import { SiPixiv, SiSteam } from "react-icons/si";
import IconCardList from "./IconCardList";

const meta: Meta<typeof IconCardList> = {
  title: "Components/IconCardList",
  component: IconCardList,
  parameters: {
    layout: "padded",
  },
  tags: ["autodocs"],
  argTypes: {
    // items 内の ReactNode は Storybook の Controls で編集できないため無効化
    items: { control: false },
  },
};

export default meta;
type Story = StoryObj<typeof IconCardList>;

const ALL_ITEMS = [
  { icon: <FaXTwitter />, label: "X", url: "https://x.com" },
  { icon: <FaYoutube />, label: "YouTube", url: "https://youtube.com" },
  { icon: <FaDiscord />, label: "Discord", url: "https://discord.com" },
  {
    icon: <SiSteam />,
    label: "Steam",
    url: "https://store.steampowered.com",
  },
  { icon: <FaGithub />, label: "GitHub", url: "https://github.com" },
  { icon: <SiPixiv />, label: "pixiv", url: "https://pixiv.net" },
];

export const Default: Story = {
  args: {
    items: ALL_ITEMS,
  },
};

export const Single: Story = {
  args: {
    items: [{ icon: <FaXTwitter />, label: "X", url: "https://x.com" }],
  },
};
