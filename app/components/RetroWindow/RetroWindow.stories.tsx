import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import RetroWindow from "./RetroWindow";

const meta: Meta<typeof RetroWindow> = {
  title: "Components/RetroWindow",
  component: RetroWindow,
  parameters: {
    layout: "padded",
  },
  tags: ["autodocs"],
  argTypes: {
    color: {
      control: "select",
      options: ["pink", "blue", "teal", "orange"],
    },
    children: { control: false },
    onClose: { action: "onClose" },
    onFocus: { action: "onFocus" },
  },
};

export default meta;
type Story = StoryObj<typeof RetroWindow>;

export const Pink: Story = {
  args: {
    title: "about_me.txt",
    color: "pink",
    children: (
      <div className="p-4 text-sm">ウィンドウの中身だよ</div>
    ),
  },
};

export const Blue: Story = {
  args: {
    title: "recent_posts.log",
    color: "blue",
    children: (
      <div className="p-4 text-sm">青いウィンドウ</div>
    ),
  },
};

export const Teal: Story = {
  args: {
    title: "loading.exe",
    color: "teal",
    children: (
      <div className="p-4 text-sm">ティールのウィンドウ</div>
    ),
  },
};

export const Orange: Story = {
  args: {
    title: "settings.ini",
    color: "orange",
    children: (
      <div className="p-4 text-sm">オレンジのウィンドウ</div>
    ),
  },
};

export const WithCloseButton: Story = {
  args: {
    title: "closeable.txt",
    color: "pink",
    onClose: () => {},
    children: (
      <div className="p-4 text-sm">閉じるボタン付き</div>
    ),
  },
};
