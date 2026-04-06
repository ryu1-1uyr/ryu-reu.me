import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import TagChip from "./TagChip";

const meta: Meta<typeof TagChip> = {
  title: "Components/TagChip",
  component: TagChip,
  parameters: {
    layout: "padded",
  },
  tags: ["autodocs"],
  argTypes: {
    size: {
      control: "select",
      options: ["sm", "md"],
    },
  },
};

export default meta;
type Story = StoryObj<typeof TagChip>;

export const Small: Story = {
  args: {
    tag: "技術",
    size: "sm",
  },
};

export const Medium: Story = {
  args: {
    tag: "お絵描き",
    size: "md",
  },
};

export const MultipleTags: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <TagChip tag="技術" size="sm" />
      <TagChip tag="お絵描き" size="sm" />
      <TagChip tag="日記" size="sm" />
      <TagChip tag="音楽" size="sm" />
    </div>
  ),
};
