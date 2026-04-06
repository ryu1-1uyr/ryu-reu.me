import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import TagInput from "./TagInput";

const meta: Meta<typeof TagInput> = {
  title: "Components/TagInput",
  component: TagInput,
  parameters: {
    layout: "padded",
    mockData: [
      {
        url: "/api/tags",
        method: "GET",
        status: 200,
        response: [
          { id: "1", name: "技術" },
          { id: "2", name: "お絵描き" },
          { id: "3", name: "日記" },
        ],
      },
    ],
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof TagInput>;

export const Empty: Story = {
  render: () => {
    const [tags, setTags] = useState<string[]>([]);
    return <TagInput value={tags} onChange={setTags} />;
  },
};

export const WithTags: Story = {
  render: () => {
    const [tags, setTags] = useState(["技術", "お絵描き"]);
    return <TagInput value={tags} onChange={setTags} />;
  },
};
