"use client";

import { useState, useRef, useCallback, DragEvent } from "react";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

type FailedUpload = {
  file: File;
  error: string;
};

export default function UploadPage() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [uploading, setUploading] = useState(false);
  const [published, setPublished] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [failedUploads, setFailedUploads] = useState<FailedUpload[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const router = useRouter();

  const handleUnauthorized = (res: Response) => {
    if (res.status === 401) {
      router.push("/login");
      return true;
    }
    return false;
  };

  const validateFile = (file: File): string | null => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return `非対応の形式: ${file.type}（JPEG, PNG, WebP, GIF のみ）`;
    }
    if (file.size > MAX_FILE_SIZE) {
      const sizeMB = (file.size / 1024 / 1024).toFixed(1);
      return `ファイルサイズが大きすぎ: ${sizeMB}MB（上限 5MB）`;
    }
    return null;
  };

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
        if (handleUnauthorized(res)) return;
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
          setContent(newContent);

          requestAnimationFrame(() => {
            textarea.selectionStart = textarea.selectionEnd =
              start + imageMarkdown.length;
            textarea.focus();
          });
        } else {
          setContent((prev) => prev + "\n" + imageMarkdown);
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
    [content]
  );

  const handleDrop = useCallback(
    (e: DragEvent<HTMLTextAreaElement>) => {
      e.preventDefault();
      setIsDragOver(false);

      const files = Array.from(e.dataTransfer.files).filter((f) =>
        f.type.startsWith("image/")
      );

      if (files.length === 0) {
        setMessage({ type: "error", text: "画像ファイルじゃないっぽい" });
        return;
      }

      for (const file of files) {
        uploadImage(file);
      }
    },
    [uploadImage]
  );

  const handleDragOver = useCallback((e: DragEvent<HTMLTextAreaElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false);
  }, []);

  const handleSave = async () => {
    if (!title || !content) {
      setMessage({ type: "error", text: "タイトル・本文は必須だよ" });
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content, published }),
      });

      if (handleUnauthorized(res)) return;
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setMessage({
        type: "success",
        text: `記事を保存したよ (ID: ${data.id})`,
      });
    } catch (err) {
      setMessage({
        type: "error",
        text: `保存失敗: ${err instanceof Error ? err.message : "unknown"}`,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="bg-elements-background min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold text-elements-headline mb-6">
          記事エディタ
        </h1>

        {/* メタ情報 */}
        <div className="mb-6">
          <label className="block text-sm text-elements-paragraph mb-1">
            タイトル
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="記事のタイトル"
            className="w-full px-3 py-2 rounded-lg bg-elements-headline text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-elements-button"
          />
        </div>

        {/* エディタ + プレビュー */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* 左: エディタ */}
          <div>
            <label className="block text-sm text-elements-paragraph mb-1">
              本文 (Markdown)
              {uploading && (
                <span className="ml-2 text-elements-button animate-pulse">
                  アップロード中...
                </span>
              )}
            </label>
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              placeholder="Markdown で記事を書く... 画像はドラッグ&ドロップで挿入できるよ"
              className={`w-full h-[600px] px-4 py-3 rounded-lg bg-elements-headline text-gray-900 font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-elements-button transition-all ${
                isDragOver
                  ? "ring-2 ring-elements-button ring-offset-2 ring-offset-elements-background"
                  : ""
              }`}
            />
          </div>

          {/* 右: プレビュー */}
          <div>
            <label className="block text-sm text-elements-paragraph mb-1">
              プレビュー
            </label>
            <div className="w-full h-[600px] px-4 py-3 rounded-lg bg-elements-headline overflow-y-auto">
              {content ? (
                <article className="prose prose-neutral max-w-none">
                  <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
                    {content}
                  </ReactMarkdown>
                </article>
              ) : (
                <p className="text-gray-400 italic">
                  ここにプレビューが表示されるよ
                </p>
              )}
            </div>
          </div>
        </div>

        {/* 失敗したアップロードのリトライ UI */}
        {failedUploads.length > 0 && (
          <div className="mb-6 rounded-lg border border-red-400/30 bg-red-400/10 p-4">
            <p className="text-sm font-bold text-red-400 mb-2">
              アップロード失敗 ({failedUploads.length}件)
            </p>
            <ul className="space-y-2">
              {failedUploads.map((item, i) => (
                <li
                  key={`${item.file.name}-${i}`}
                  className="flex items-center justify-between text-sm"
                >
                  <div className="text-elements-paragraph min-w-0">
                    <span className="truncate block">{item.file.name}</span>
                    <span className="text-red-400 text-xs">{item.error}</span>
                  </div>
                  <div className="flex gap-2 ml-4 shrink-0">
                    <button
                      onClick={() => uploadImage(item.file)}
                      disabled={uploading}
                      className="px-3 py-1 rounded bg-elements-button text-elements-background text-xs font-bold hover:opacity-90 disabled:opacity-50"
                    >
                      リトライ
                    </button>
                    <button
                      onClick={() =>
                        setFailedUploads((prev) =>
                          prev.filter((_, idx) => idx !== i)
                        )
                      }
                      className="px-3 py-1 rounded border border-elements-paragraph text-elements-paragraph text-xs hover:opacity-70"
                    >
                      消す
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* メッセージ + 保存 */}
        <div className="flex items-center gap-4">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2 rounded-lg bg-elements-button text-elements-background font-bold hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {saving ? "保存中..." : "記事を保存"}
          </button>
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <div
              onClick={() => setPublished((prev) => !prev)}
              className={`relative w-10 h-5 rounded-full transition-colors ${
                published ? "bg-green-500" : "bg-gray-500"
              }`}
            >
              <div
                className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                  published ? "translate-x-5" : ""
                }`}
              />
            </div>
            <span className="text-sm text-elements-paragraph">
              {published ? "公開" : "下書き"}
            </span>
          </label>
          {message && (
            <span
              className={`text-sm ${
                message.type === "success" ? "text-green-400" : "text-red-400"
              }`}
            >
              {message.text}
            </span>
          )}
        </div>
      </div>
    </main>
  );
}
