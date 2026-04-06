import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import WeatherControl from "./WeatherControl";
import { WeatherOverrideProvider } from "@/app/contexts/WeatherOverride";

const meta: Meta<typeof WeatherControl> = {
  title: "Sections/WeatherControl",
  component: WeatherControl,
  parameters: {
    layout: "padded",
  },
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <WeatherOverrideProvider>
        <Story />
      </WeatherOverrideProvider>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof WeatherControl>;

export const Default: Story = {};
