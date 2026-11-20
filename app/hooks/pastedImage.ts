/**
 * クリップボードから貼られた画像の前処理。
 *
 * ブラウザで「画像をコピー」すると、元が JPEG/WebP でもクリップボードには
 * PNG として入るため、写真だと数倍に膨れてアップロード上限 (5MB) を超えやすい。
 * PNG はブラウザで WebP (非対応なら JPEG) に変換し直し、小さくなった場合だけ差し替える。
 */

/** 変換し直す対象。GIF はアニメーションが消えるので対象外 */
const REENCODE_TYPES = ["image/png", "image/bmp"];
const REENCODE_QUALITY = 0.9;

/** クリップボードのファイルから画像だけを取り出す */
export function pickPastedImages(files: ArrayLike<File>): File[] {
  return Array.from(files).filter((f) => f.type.startsWith("image/"));
}

export function shouldReencode(type: string): boolean {
  return REENCODE_TYPES.includes(type);
}

const EXTENSIONS: Record<string, string> = {
  "image/webp": "webp",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/gif": "gif",
};

/**
 * 貼り付け画像のファイル名。クリップボードの画像は名前が常に image.png なので、
 * 日時から一意な名前を付け直す (Markdown の alt にもなる)
 */
export function pastedFileName(type: string, now: Date, index = 0): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  const stamp =
    `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}` +
    `-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
  const suffix = index > 0 ? `-${index + 1}` : "";
  return `pasted-${stamp}${suffix}.${EXTENSIONS[type] ?? "png"}`;
}

function encode(canvas: HTMLCanvasElement, type: string): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, type, REENCODE_QUALITY));
}

/**
 * 貼り付け画像をアップロード用のファイルに整える (ブラウザ専用)。
 * 変換できない・小さくならないときは元の画像のまま名前だけ付け直す。
 */
export async function preparePastedImage(
  file: File,
  now: Date,
  index = 0
): Promise<File> {
  const rename = (blob: Blob) =>
    new File([blob], pastedFileName(blob.type, now, index), { type: blob.type });

  if (!shouldReencode(file.type)) return rename(file);

  try {
    const bitmap = await createImageBitmap(file);
    const canvas = document.createElement("canvas");
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    canvas.getContext("2d")?.drawImage(bitmap, 0, 0);
    bitmap.close();

    // WebP で書き出せないブラウザは PNG を返すので、その場合は JPEG を試す
    let blob = await encode(canvas, "image/webp");
    if (!blob || blob.type !== "image/webp") {
      blob = await encode(canvas, "image/jpeg");
    }
    if (blob && blob.size < file.size) return rename(blob);
  } catch {
    // デコード・変換に失敗したら元の画像で続行する (サイズ超過ならアップロード側で弾かれる)
  }
  return rename(file);
}
