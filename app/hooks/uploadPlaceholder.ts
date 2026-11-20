/**
 * アップロード中の画像を本文に仮置きするためのプレースホルダー操作。
 *
 * 完了時に「アップロード開始時点の本文」で上書きすると、同時に走った別の画像や
 * アップロード中に打った文字が消える。そこで開始時に仮の行を差し込み、
 * 完了時は最新の本文からその行を探して置き換える。
 */

export function uploadingPlaceholder(fileName: string, id: string): string {
  return `![アップロード中: ${fileName}](uploading:${id})`;
}

/** 選択範囲 [start, end) を複数のプレースホルダー (改行区切り) で置き換える */
export function insertPlaceholders(
  content: string,
  start: number,
  end: number,
  placeholders: string[]
): { content: string; cursor: number } {
  const block = placeholders.join("\n");
  return {
    content: content.slice(0, start) + block + content.slice(end),
    cursor: start + block.length,
  };
}

/**
 * プレースホルダーを置き換える。ユーザーが消していたら、
 * replacement があれば失わないよう末尾に足し、無ければ (失敗時) 何もしない
 */
export function resolvePlaceholder(
  content: string,
  placeholder: string,
  replacement: string | null
): string {
  if (content.includes(placeholder)) {
    return content.replace(placeholder, () => replacement ?? "");
  }
  if (replacement === null) return content;
  return content + (content === "" || content.endsWith("\n") ? "" : "\n") + replacement;
}
