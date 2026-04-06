import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import AboutMe from "./AboutMe";

const meta: Meta<typeof AboutMe> = {
  title: "Sections/AboutMe",
  component: AboutMe,
  parameters: {
    layout: "padded",
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof AboutMe>;

export const Default: Story = {};
