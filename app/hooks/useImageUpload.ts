"use client";

import {
  useState,
  useCallback,
  type ClipboardEvent,
  type DragEvent,
  type RefObject,
} from "react";
import { useRouter } from "next/navigation";
import { pickPastedImages, preparePastedImage } from "./pastedImage";
import {
  insertPlaceholders,
  resolvePlaceholder,
  uploadingPlaceholder,
} from "./uploadPlaceholder";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export type FailedUpload = {
  file: File;
  error: string;
};

type Options = {
  textareaRef: RefObject<HTMLTextAreaElement | null>;
  /** 本文を最新の値から更新する (アップロード完了時に他の変更を消さないため) */
  onContentChange: (update: (prev: string) => string) => void;
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
 * markdown 挿入、D&D・ペーストのハンドリング、失敗リトライの管理をまとめる。
 * 挿入はプレースホルダー方式で、複数枚の同時アップロードや入力中の文字を壊さない。
 */
export function useImageUpload({
  textareaRef,
  onContentChange,
  onError,
}: Options) {
  const router = useRouter();
  // 同時に複数走るので件数で持つ
  const [uploadingCount, setUploadingCount] = useState(0);
  const [isDragOver, setIsDragOver] = useState(false);
  const [failedUploads, setFailedUploads] = useState<FailedUpload[]>([]);

  const sendFile = useCallback(
    async (file: File, placeholder: string) => {
      setUploadingCount((n) => n + 1);
      try {
        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });
        if (res.status === 401) {
          onContentChange((prev) => resolvePlaceholder(prev, placeholder, null));
          router.push("/login");
          return;
        }
        const data = await res.json();

        if (!res.ok) throw new Error(data.error);

        // 成功したらリトライリストから除去
        setFailedUploads((prev) => prev.filter((f) => f.file !== file));
        onContentChange((prev) =>
          resolvePlaceholder(prev, placeholder, `![${file.name}](${data.url})`)
        );
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "unknown";
        onContentChange((prev) => resolvePlaceholder(prev, placeholder, null));
        setFailedUploads((prev) => [
          ...prev.filter((f) => f.file !== file),
          { file, error: errorMsg },
        ]);
      } finally {
        setUploadingCount((n) => n - 1);
      }
    },
    [onContentChange, router]
  );

  /** 検証を通った画像のプレースホルダーをカーソル位置にまとめて置き、並列で送る */
  const uploadImages = useCallback(
    (files: File[]) => {
      const valid: File[] = [];
      for (const file of files) {
        const validationError = validateFile(file);
        if (validationError) {
          setFailedUploads((prev) => [...prev, { file, error: validationError }]);
        } else {
          valid.push(file);
        }
      }
      if (valid.length === 0) return;

      const placeholders = valid.map((file) =>
        uploadingPlaceholder(file.name, crypto.randomUUID())
      );

      const textarea = textareaRef.current;
      const start = textarea?.selectionStart;
      const end = textarea?.selectionEnd;
      let cursor: number | null = null;
      onContentChange((prev) => {
        const at = start ?? prev.length;
        const inserted = insertPlaceholders(prev, at, end ?? at, placeholders);
        cursor = inserted.cursor;
        return inserted.content;
      });
      if (textarea) {
        requestAnimationFrame(() => {
          if (cursor === null) return;
          textarea.selectionStart = textarea.selectionEnd = cursor;
          textarea.focus();
        });
      }

      valid.forEach((file, i) => sendFile(file, placeholders[i]));
    },
    [onContentChange, sendFile, textareaRef]
  );

  /** 単体アップロード (リトライ用) */
  const uploadImage = useCallback(
    (file: File) => uploadImages([file]),
    [uploadImages]
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

      uploadImages(files);
    },
    [uploadImages, onError]
  );

  // クリップボードに画像があればアップロードする (X などで「画像をコピー」したもの、スクショ等)。
  // 画像が無ければ何もせず、通常のテキスト貼り付けに任せる
  const handlePaste = useCallback(
    async (e: ClipboardEvent<HTMLTextAreaElement>) => {
      const images = pickPastedImages(e.clipboardData.files);
      if (images.length === 0) return;

      // 画像と一緒に入っている HTML (<img src=...>) やテキストは貼らない
      e.preventDefault();
      const now = new Date();
      const files = await Promise.all(
        images.map((file, i) => preparePastedImage(file, now, i))
      );
      uploadImages(files);
    },
    [uploadImages]
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
    uploading: uploadingCount > 0,
    isDragOver,
    failedUploads,
    uploadImage,
    removeFailedUpload,
    handleDrop,
    handlePaste,
    handleDragOver,
    handleDragLeave,
  };
}
