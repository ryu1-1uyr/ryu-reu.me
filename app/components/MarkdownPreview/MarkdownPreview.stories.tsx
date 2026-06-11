import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import MarkdownPreview from "./MarkdownPreview";

const meta: Meta<typeof MarkdownPreview> = {
  title: "Components/MarkdownPreview",
  component: MarkdownPreview,
  parameters: {
    layout: "padded",
  },
  decorators: [
    (Story) => (
      <article className="prose prose-neutral max-w-none bg-white p-4 rounded-lg">
        <Story />
      </article>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof MarkdownPreview>;

export const PlainText: Story = {
  args: {
    content: "ただのテキスト段落。**強調** と `inline code` を含む。",
  },
};

// rehype-pretty-code + shiki の非同期ハイライトが通ることの確認用。
// react-markdown 時代は code fence があると「runSync finished async」で落ちていた。
export const WithCodeBlocks: Story = {
  args: {
    content: [
      "# 見出し",
      "",
      "TypeScript のコードブロック:",
      "",
      "```ts",
      'const greet = (name: string): string => {',
      '  return `Hello, ${name}`;',
      "};",
      "```",
      "",
      "diff も:",
      "",
      "```diff",
      "- const a = 1;",
      "+ const a = 2;",
      "```",
      "",
      "| col1 | col2 |",
      "|---|---|",
      "| GFM | table |",
    ].join("\n"),
  },
};
