"use client";

import { useState, useRef, useCallback, DragEvent, ChangeEvent } from "react";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

type Props = {
  value: string | null;
  onChange: (url: string | null) => void;
  // 本文の Markdown から抽出した画像 URL（記事内画像から選択するため）
  contentImageUrls?: string[];
};

export default function OgImagePicker({
  value,
  onChange,
  contentImageUrls = [],
}: Props) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [showContentPicker, setShowContentPicker] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return `非対応の形式: ${file.type}（JPEG, PNG, WebP, GIF のみ）`;
    }
    if (file.size > MAX_FILE_SIZE) {
      return `サイズ超過: ${(file.size / 1024 / 1024).toFixed(1)}MB（上限 10MB）`;
    }
    return null;
  };

  const uploadFile = useCallback(
    async (file: File) => {
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        return;
      }
      setError(null);
      setUploading(true);
      try {
        const formData = new FormData();
        formData.append("file", file);
        const res = await fetch("/api/upload/og", {
          method: "POST",
          body: formData,
        });
        if (res.status === 401) {
          setError("ログインが必要だよ");
          return;
        }
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "アップロード失敗");
        onChange(data.url);
      } catch (e) {
        setError(e instanceof Error ? e.message : "アップロード失敗");
      } finally {
        setUploading(false);
      }
    },
    [onChange]
  );

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
    e.target.value = ""; // 同じファイル再選択可能に
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = Array.from(e.dataTransfer.files).find((f) =>
      f.type.startsWith("image/")
    );
    if (file) uploadFile(file);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => setIsDragOver(false);

  const handleClear = () => {
    onChange(null);
    setShowContentPicker(false);
  };

  return (
    <div className="space-y-3">
      <label className="block text-sm text-elements-paragraph">
        OGP 画像 <span className="text-xs opacity-60">(任意・推奨 1200×630。自動でリサイズ&WebP化されます)</span>
      </label>

      {value ? (
        // プレビュー表示
        <div className="space-y-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={value}
            alt="OGP プレビュー"
            className="w-full max-w-md rounded-lg border border-elements-paragraph/20 aspect-[1200/630] object-cover"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="px-3 py-1.5 rounded bg-elements-button text-elements-background text-sm font-bold hover:opacity-90 disabled:opacity-50"
            >
              {uploading ? "アップロード中..." : "変更"}
            </button>
            <button
              type="button"
              onClick={handleClear}
              className="px-3 py-1.5 rounded border border-elements-paragraph text-elements-paragraph text-sm hover:opacity-70"
            >
              自動に戻す
            </button>
          </div>
        </div>
      ) : (
        // 未選択時の UI
        <div className="space-y-2">
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={`w-full max-w-md p-6 rounded-lg border-2 border-dashed flex flex-col items-center justify-center gap-2 transition-colors ${
              isDragOver
                ? "border-elements-button bg-elements-button/10"
                : "border-elements-paragraph/30"
            }`}
          >
            <p className="text-sm text-elements-paragraph">
              画像をドラッグ&ドロップ
            </p>
            <p className="text-xs text-elements-paragraph/60">または</p>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="px-3 py-1.5 rounded bg-elements-button text-elements-background text-sm font-bold hover:opacity-90 disabled:opacity-50"
            >
              {uploading ? "アップロード中..." : "画像を選ぶ"}
            </button>
          </div>

          {contentImageUrls.length > 0 && (
            <>
              <button
                type="button"
                onClick={() => setShowContentPicker((s) => !s)}
                className="text-sm text-elements-button hover:underline"
              >
                {showContentPicker
                  ? "▲ 閉じる"
                  : `▼ 記事内画像から選ぶ (${contentImageUrls.length})`}
              </button>
              {showContentPicker && (
                <div className="grid grid-cols-3 gap-2 max-w-md max-h-60 overflow-y-auto p-2 rounded border border-elements-paragraph/20">
                  {contentImageUrls.map((url) => (
                    <button
                      type="button"
                      key={url}
                      onClick={() => {
                        onChange(url);
                        setShowContentPicker(false);
                      }}
                      className="aspect-[1200/630] overflow-hidden rounded hover:ring-2 hover:ring-elements-button transition-all"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={url}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept={ALLOWED_TYPES.join(",")}
        onChange={handleFileChange}
        className="hidden"
      />

      {error && <p className="text-sm text-red-400">{error}</p>}
    </div>
  );
}

// 本文 Markdown から画像 URL を抽出するヘルパー
export function extractImageUrls(content: string): string[] {
  const urls: string[] = [];
  const mdRe = /!\[[^\]]*\]\(([^)]+)\)/g;
  const htmlRe = /<img[^>]+src=["']([^"']+)["']/g;
  let m: RegExpExecArray | null;
  while ((m = mdRe.exec(content)) !== null) urls.push(m[1]);
  while ((m = htmlRe.exec(content)) !== null) urls.push(m[1]);
  return [...new Set(urls)]; // 重複除去
}
