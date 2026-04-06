import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import DrawingCanvas from "./DrawingCanvas";
import { SkyDrawingsProvider } from "@/app/contexts/SkyDrawings";

const meta: Meta<typeof DrawingCanvas> = {
  title: "Sections/DrawingCanvas",
  component: DrawingCanvas,
  parameters: {
    layout: "padded",
  },
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <SkyDrawingsProvider>
        <Story />
      </SkyDrawingsProvider>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof DrawingCanvas>;

export const Default: Story = {};
