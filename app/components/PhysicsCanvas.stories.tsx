import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import PhysicsCanvas from "./PhysicsCanvas";

const meta: Meta<typeof PhysicsCanvas> = {
  title: "Components/PhysicsCanvas",
  component: PhysicsCanvas,
  parameters: {
    layout: "padded",
  },
  tags: ["autodocs"],
  argTypes: {
    type: {
      control: "select",
      options: ["drawShapes", "sway", "drag"],
    },
  },
};

export default meta;
type Story = StoryObj<typeof PhysicsCanvas>;

export const DrawShapes: Story = {
  args: {
    type: "drawShapes",
  },
};

export const Sway: Story = {
  args: {
    type: "sway",
  },
};

export const Drag: Story = {
  args: {
    type: "drag",
  },
};
