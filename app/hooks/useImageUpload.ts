"use client";

import { useState, useCallback, type DragEvent, type RefObject } from "react";
import { useRouter } from "next/navigation";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export type FailedUpload = {
  file: File;
  error: string;
};

type Options = {
  textareaRef: RefObject<HTMLTextAreaElement | null>;
  content: string;
  onContentChange: (content: string) => void;
  /** 画像以外のファイルがドロップされた等のエラー通知 */
  onError: (message: string) => void;
};

function validateFile(file: File): string | null {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return `非対応の形式: ${file.type}（JPEG, PNG, WebP, GIF のみ）`;
  }
  if (file.size > MAX_FILE_SIZE) {
    const sizeMB = (file.size / 1024 / 1024).toFixed(1);
    return `ファイルサイズが大きすぎ: ${sizeMB}MB（上限 5MB）`;
  }
  return null;
}

/**
 * エディタ用の画像アップロードフック。
 * /api/upload への送信、バリデーション、textarea カーソル位置への
 * markdown 挿入、D&D ハンドリング、失敗リトライの管理をまとめる。
 */
export function useImageUpload({
  textareaRef,
  content,
  onContentChange,
  onError,
}: Options) {
  const router = useRouter();
  const [uploading, setUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [failedUploads, setFailedUploads] = useState<FailedUpload[]>([]);

  const uploadImage = useCallback(
    async (file: File) => {
      const validationError = validateFile(file);
      if (validationError) {
        setFailedUploads((prev) => [...prev, { file, error: validationError }]);
        return;
      }

      setUploading(true);
      try {
        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });
        if (res.status === 401) {
          router.push("/login");
          return;
        }
        const data = await res.json();

        if (!res.ok) throw new Error(data.error);

        // 成功したらリトライリストから除去
        setFailedUploads((prev) => prev.filter((f) => f.file !== file));

        // カーソル位置に markdown 画像構文を挿入
        const textarea = textareaRef.current;
        const imageMarkdown = `![${file.name}](${data.url})`;

        if (textarea) {
          const start = textarea.selectionStart;
          const end = textarea.selectionEnd;
          const newContent =
            content.substring(0, start) +
            imageMarkdown +
            content.substring(end);
          onContentChange(newContent);

          requestAnimationFrame(() => {
            textarea.selectionStart = textarea.selectionEnd =
              start + imageMarkdown.length;
            textarea.focus();
          });
        } else {
          onContentChange(content + "\n" + imageMarkdown);
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "unknown";
        setFailedUploads((prev) => [
          ...prev.filter((f) => f.file !== file),
          { file, error: errorMsg },
        ]);
      } finally {
        setUploading(false);
      }
    },
    [content, onContentChange, router, textareaRef]
  );

  const handleDrop = useCallback(
    (e: DragEvent<HTMLTextAreaElement>) => {
      e.preventDefault();
      setIsDragOver(false);

      const files = Array.from(e.dataTransfer.files).filter((f) =>
        f.type.startsWith("image/")
      );

      if (files.length === 0) {
        onError("画像ファイルじゃないっぽい");
        return;
      }

      for (const file of files) {
        uploadImage(file);
      }
    },
    [uploadImage, onError]
  );

  const handleDragOver = useCallback((e: DragEvent<HTMLTextAreaElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false);
  }, []);

  const removeFailedUpload = useCallback((index: number) => {
    setFailedUploads((prev) => prev.filter((_, i) => i !== index));
  }, []);

  return {
    uploading,
    isDragOver,
    failedUploads,
    uploadImage,
    removeFailedUpload,
    handleDrop,
    handleDragOver,
    handleDragLeave,
  };
}
