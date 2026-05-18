import type { Root as MdastRoot, Code as MdastCode } from "mdast";
import { visit } from "unist-util-visit";

/**
 * 全コードフェンスに `showLineNumbers` meta を強制注入する remark plugin。
 *
 * rehype-pretty-code は `defaultLineNumbers` オプションを持たないため、
 * remark 段階で markdown AST を書き換える方式で全コードブロックに行番号を付ける。
 *
 * SSR (lib/markdown.ts) と CSR (lib/markdown-client.ts) で共有するため、
 * "server-only" 宣言のない独立ファイルに置く。
 */
export function remarkForceLineNumbers() {
  return (tree: MdastRoot) => {
    visit(tree, "code", (node: MdastCode) => {
      const existing = node.meta ?? "";
      if (!existing.includes("showLineNumbers")) {
        node.meta = existing ? `${existing} showLineNumbers` : "showLineNumbers";
      }
    });
  };
}
