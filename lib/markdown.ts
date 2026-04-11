import "server-only";

import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeRaw from "rehype-raw";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import rehypeStringify from "rehype-stringify";

// rehype-sanitize は hast (HTML AST) のプロパティ名を使う
// HTML の class → hast では className、data-* → data* で一括許可
const schema = {
  ...defaultSchema,
  attributes: {
    ...defaultSchema.attributes,
    img: [...(defaultSchema.attributes?.img ?? []), "className", "loading"],
    blockquote: [...(defaultSchema.attributes?.blockquote ?? []), "className", "data*"],
    a: [...(defaultSchema.attributes?.a ?? []), "className"],
  },
};

const processor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkRehype, { allowDangerousHtml: true })
  .use(rehypeRaw)
  .use(rehypeSanitize, schema)
  .use(rehypeStringify);

/** markdown 文字列を sanitize 済み HTML に変換する（サーバー専用） */
export async function renderMarkdown(md: string): Promise<string> {
  const result = await processor.process(md);
  return String(result);
}
