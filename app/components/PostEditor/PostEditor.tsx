"use client";

import {
  useState,
  useRef,
  useCallback,
  useMemo,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";
import TagInput from "@/app/components/TagInput";
import OgImagePicker, { extractImageUrls } from "@/app/components/OgImagePicker";
import MarkdownPreview from "@/app/components/MarkdownPreview";
import { useImageUpload } from "@/app/hooks/useImageUpload";

export type PostFormValue = {
  title: string;
  content: string;
  published: boolean;
  tags: string[];
  ogImage: string | null;
};

export const EMPTY_POST_FORM: PostFormValue = {
  title: "",
  content: "",
  published: true,
  tags: [],
  ogImage: null,
};

export type EditorMessage = {
  type: "success" | "error";
  text: string;
};

type Props = {
  heading: string;
  value: PostFormValue;
  onChange: Dispatch<SetStateAction<PostFormValue>>;
  /** 保存処理。結果メッセージは親が onMessage 経由で反映する */
  onSave: (value: PostFormValue) => Promise<void>;
  saveLabel: string;
  savingLabel: string;
  message: EditorMessage | null;
  onMessage: (message: EditorMessage | null) => void;
  /** ヘッダー直下に出すお知らせ（下書き復元通知など） */
  banner?: ReactNode;
};

/**
 * 記事エディタの共通 UI。
 * フォーム値（PostFormValue）は親が持つ controlled 設計で、
 * upload（新規作成 + 下書き自動保存）/ update（既存記事の編集）の両方から使う。
 */
export default function PostEditor({
  heading,
  value,
  onChange,
  onSave,
  saveLabel,
  savingLabel,
  message,
  onMessage,
  banner,
}: Props) {
  const [saving, setSaving] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const scrollSourceRef = useRef<"editor" | "preview" | null>(null);

  const setContent = useCallback(
    (content: string) => onChange((prev) => ({ ...prev, content })),
    [onChange]
  );

  const {
    uploading,
    isDragOver,
    failedUploads,
    uploadImage,
    removeFailedUpload,
    handleDrop,
    handleDragOver,
    handleDragLeave,
  } = useImageUpload({
    textareaRef,
    content: value.content,
    onContentChange: setContent,
    onError: (text) => onMessage({ type: "error", text }),
  });

  const handleEditorScroll = useCallback(() => {
    if (scrollSourceRef.current === "preview") return;
    scrollSourceRef.current = "editor";
    const ta = textareaRef.current;
    const pv = previewRef.current;
    if (!ta || !pv) return;
    const scrollable = ta.scrollHeight - ta.clientHeight;
    if (scrollable <= 0) return;
    const ratio = ta.scrollTop / scrollable;
    pv.scrollTop = ratio * (pv.scrollHeight - pv.clientHeight);
    requestAnimationFrame(() => {
      scrollSourceRef.current = null;
    });
  }, []);

  const handlePreviewScroll = useCallback(() => {
    if (scrollSourceRef.current === "editor") return;
    scrollSourceRef.current = "preview";
    const ta = textareaRef.current;
    const pv = previewRef.current;
    if (!ta || !pv) return;
    const scrollable = pv.scrollHeight - pv.clientHeight;
    if (scrollable <= 0) return;
    const ratio = pv.scrollTop / scrollable;
    ta.scrollTop = ratio * (ta.scrollHeight - ta.clientHeight);
    requestAnimationFrame(() => {
      scrollSourceRef.current = null;
    });
  }, []);

  // 本文から画像 URL を抽出（記事内画像から OG 選択用）
  const contentImageUrls = useMemo(
    () => extractImageUrls(value.content),
    [value.content]
  );

  const handleSave = async () => {
    if (!value.title || !value.content) {
      onMessage({ type: "error", text: "タイトル・本文は必須だよ" });
      return;
    }

    setSaving(true);
    onMessage(null);
    try {
      await onSave(value);
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="bg-elements-background/80 backdrop-blur-sm min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold text-elements-headline mb-6">
          {heading}
        </h1>

        {banner}

        {/* メタ情報 */}
        <div className="mb-6">
          <label className="block text-sm text-elements-paragraph mb-1">
            タイトル
          </label>
          <input
            type="text"
            value={value.title}
            onChange={(e) =>
              onChange((prev) => ({ ...prev, title: e.target.value }))
            }
            placeholder="記事のタイトル"
            className="w-full px-3 py-2 rounded-lg bg-elements-headline text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-elements-button"
          />
        </div>

        {/* タグ */}
        <div className="mb-6">
          <label className="block text-sm text-elements-paragraph mb-1">
            タグ
          </label>
          <TagInput
            value={value.tags}
            onChange={(tags) => onChange((prev) => ({ ...prev, tags }))}
          />
        </div>

        {/* OGP 画像 */}
        <div className="mb-6">
          <OgImagePicker
            value={value.ogImage}
            onChange={(ogImage) => onChange((prev) => ({ ...prev, ogImage }))}
            contentImageUrls={contentImageUrls}
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
              value={value.content}
              onChange={(e) => setContent(e.target.value)}
              onScroll={handleEditorScroll}
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
            <div
              ref={previewRef}
              onScroll={handlePreviewScroll}
              className="w-full h-[600px] px-4 py-3 rounded-lg bg-elements-headline overflow-y-auto"
            >
              {value.content ? (
                <article className="prose prose-neutral prose-mobile-tuned max-w-none">
                  <MarkdownPreview content={value.content} />
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
                      onClick={() => removeFailedUpload(i)}
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
            {saving ? savingLabel : saveLabel}
          </button>
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <div
              onClick={() =>
                onChange((prev) => ({ ...prev, published: !prev.published }))
              }
              className={`relative w-10 h-5 rounded-full transition-colors ${
                value.published ? "bg-green-500" : "bg-gray-500"
              }`}
            >
              <div
                className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                  value.published ? "translate-x-5" : ""
                }`}
              />
            </div>
            <span className="text-sm text-elements-paragraph">
              {value.published ? "公開" : "下書き"}
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
