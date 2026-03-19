import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import Pagination from "./Pagination";

const meta: Meta<typeof Pagination> = {
  title: "Components/Pagination",
  component: Pagination,
  parameters: {
    layout: "padded",
    nextjs: {
      appDirectory: true,
    },
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof Pagination>;

export const Default: Story = {
  args: {
    currentPage: 1,
    totalPages: 5,
    basePath: "/blog",
  },
};

export const MiddlePage: Story = {
  args: {
    currentPage: 3,
    totalPages: 5,
    basePath: "/blog",
  },
};

export const LastPage: Story = {
  args: {
    currentPage: 5,
    totalPages: 5,
    basePath: "/blog",
  },
};

export const ManyPages: Story = {
  args: {
    currentPage: 5,
    totalPages: 20,
    basePath: "/blog",
  },
};

export const SinglePage: Story = {
  args: {
    currentPage: 1,
    totalPages: 1,
    basePath: "/blog",
  },
};
