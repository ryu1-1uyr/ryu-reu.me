import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import SkyCanvas from "./SkyCanvas";

const meta: Meta<typeof SkyCanvas> = {
  title: "Components/SkyCanvas",
  component: SkyCanvas,
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
  argTypes: {
    phase: {
      control: "select",
      options: ["night", "sunrise", "day", "sunset"],
      description: "空のフェーズ（時間帯）",
    },
    phaseProgress: {
      control: { type: "range", min: 0, max: 1, step: 0.01 },
      description: "フェーズ内の進行度（0〜1）",
    },
    weatherCondition: {
      control: "select",
      options: ["clear", "clouds", "rain", "snow", "drizzle", "thunderstorm"],
      description: "天気の状態",
    },
  },
  decorators: [
    (Story) => (
      <div style={{ width: "100vw", height: "100vh", position: "relative" }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof SkyCanvas>;

// --- 基本フェーズ（快晴） ---

export const NightClear: Story = {
  args: { phase: "night", phaseProgress: 0.5, weatherCondition: "clear" },
};

export const SunriseClear: Story = {
  args: { phase: "sunrise", phaseProgress: 0.5, weatherCondition: "clear" },
};

export const DayClear: Story = {
  args: { phase: "day", phaseProgress: 0.5, weatherCondition: "clear" },
};

export const SunsetClear: Story = {
  args: { phase: "sunset", phaseProgress: 0.5, weatherCondition: "clear" },
};

// --- 天気バリエーション ---

export const NightRain: Story = {
  args: { phase: "night", phaseProgress: 0.5, weatherCondition: "rain" },
};

export const DayRain: Story = {
  args: { phase: "day", phaseProgress: 0.5, weatherCondition: "rain" },
};

export const NightSnow: Story = {
  args: { phase: "night", phaseProgress: 0.5, weatherCondition: "snow" },
};

export const DaySnow: Story = {
  args: { phase: "day", phaseProgress: 0.5, weatherCondition: "snow" },
};

export const DayClouds: Story = {
  args: { phase: "day", phaseProgress: 0.5, weatherCondition: "clouds" },
};

export const SunsetClouds: Story = {
  args: { phase: "sunset", phaseProgress: 0.7, weatherCondition: "clouds" },
};

export const NightThunderstorm: Story = {
  args: {
    phase: "night",
    phaseProgress: 0.5,
    weatherCondition: "thunderstorm",
  },
};

export const DayDrizzle: Story = {
  args: { phase: "day", phaseProgress: 0.5, weatherCondition: "drizzle" },
};

// --- フェーズ遷移の境目（ブレンドが見える） ---

export const SunriseStart: Story = {
  name: "朝焼け開始（夜→朝ブレンド）",
  args: { phase: "sunrise", phaseProgress: 0.05, weatherCondition: "clear" },
};

export const SunsetEnd: Story = {
  name: "夕焼け終盤（星が見え始める）",
  args: { phase: "sunset", phaseProgress: 0.9, weatherCondition: "clear" },
};
