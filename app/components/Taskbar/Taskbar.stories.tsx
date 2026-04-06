import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import Taskbar from "./Taskbar";
import { WindowManagerProvider } from "@/app/contexts/WindowManager";

const meta: Meta<typeof Taskbar> = {
  title: "Components/Taskbar",
  component: Taskbar,
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <WindowManagerProvider>
        <div className="h-screen bg-elements-background relative">
          <Story />
        </div>
      </WindowManagerProvider>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof Taskbar>;

export const Default: Story = {};
