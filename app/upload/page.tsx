"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import PostEditor, {
  EMPTY_POST_FORM,
  type PostFormValue,
  type EditorMessage,
} from "@/app/components/PostEditor";

const DRAFT_KEY = "upload-draft";

function loadDraft() {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as {
      title: string;
      content: string;
      published: boolean;
      tags?: string[];
      ogImage?: string | null;
      savedAt: string;
    };
  } catch {
    return null;
  }
}

export default function UploadPage() {
  const [value, setValue] = useState<PostFormValue>(EMPTY_POST_FORM);
  const [message, setMessage] = useState<EditorMessage | null>(null);
  const [draftRestoredAt, setDraftRestoredAt] = useState<string | null>(null);
  const router = useRouter();

  // HydrationのエラーがうざいのでHTMLマウント後にlocalStorageから下書きを復元
  useEffect(() => {
    const draft = loadDraft();
    if (draft) {
      setValue({
        title: draft.title,
        content: draft.content,
        published: draft.published,
        tags: draft.tags ?? [],
        ogImage: draft.ogImage ?? null,
      });
      setDraftRestoredAt(draft.savedAt);
    }
  }, []);

  // 自動保存（1秒デバウンス）
  useEffect(() => {
    if (!value.title && !value.content) return;
    const timer = setTimeout(() => {
      localStorage.setItem(
        DRAFT_KEY,
        JSON.stringify({ ...value, savedAt: new Date().toISOString() })
      );
    }, 1000);
    return () => clearTimeout(timer);
  }, [value]);

  const clearDraft = () => localStorage.removeItem(DRAFT_KEY);

  const handleSave = async (v: PostFormValue) => {
    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(v),
      });

      if (res.status === 401) {
        router.push("/login");
        return;
      }
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      clearDraft();
      setMessage({
        type: "success",
        text: `記事を保存したよ (ID: ${data.id})`,
      });
    } catch (err) {
      setMessage({
        type: "error",
        text: `保存失敗: ${err instanceof Error ? err.message : "unknown"}`,
      });
    }
  };

  return (
    <PostEditor
      heading="記事エディタ"
      value={value}
      onChange={setValue}
      onSave={handleSave}
      saveLabel="記事を保存"
      savingLabel="保存中..."
      message={message}
      onMessage={setMessage}
      banner={
        draftRestoredAt && (
          <div className="mb-4 flex items-center justify-between rounded-lg border border-elements-button/30 bg-elements-button/10 px-4 py-2">
            <span className="text-sm text-elements-paragraph">
              下書きを復元したよ（
              {new Date(draftRestoredAt).toLocaleString("ja-JP")}）
            </span>
            <button
              onClick={() => {
                clearDraft();
                setValue(EMPTY_POST_FORM);
                setMessage(null);
                window.location.reload();
              }}
              className="text-xs text-red-400 hover:text-red-300"
            >
              破棄する
            </button>
          </div>
        )
      }
    />
  );
}
