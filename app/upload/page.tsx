"use client";

import {
  useState,
  useEffect,
  useSyncExternalStore,
  type Dispatch,
  type SetStateAction,
} from "react";
import { useRouter } from "next/navigation";
import PostEditor, {
  EMPTY_POST_FORM,
  type PostFormValue,
  type EditorMessage,
} from "@/app/components/PostEditor";

const DRAFT_KEY = "upload-draft";

type StoredDraft = {
  form: PostFormValue;
  savedAt: string;
};

function loadDraft(): StoredDraft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as {
      title: string;
      content: string;
      published: boolean;
      tags?: string[];
      ogImage?: string | null;
      savedAt: string;
    };
    return {
      form: {
        title: parsed.title,
        content: parsed.content,
        published: parsed.published,
        tags: parsed.tags ?? [],
        ogImage: parsed.ogImage ?? null,
      },
      savedAt: parsed.savedAt,
    };
  } catch {
    return null;
  }
}

// localStorage はサーバーに存在しないので、下書きの読み出しは
// useSyncExternalStore で扱う。サーバー snapshot を null に固定することで
// hydration 後に復元へ切り替わる（マウント後に setState する形だと
// effect 内 setState になり、Hydration エラーの回避にもならない）。
let draftSnapshot: StoredDraft | null | undefined;

function getDraftSnapshot(): StoredDraft | null {
  // getSnapshot は呼ぶたび同じ参照を返す必要があるため初回の結果を保持する
  if (draftSnapshot === undefined) draftSnapshot = loadDraft();
  return draftSnapshot;
}

function getServerDraftSnapshot(): StoredDraft | null {
  return null;
}

// 復元した下書きは読み出し後に変化しない（破棄はページごとリロードする）
function subscribeDraft(): () => void {
  return () => {};
}

export default function UploadPage() {
  const restored = useSyncExternalStore(
    subscribeDraft,
    getDraftSnapshot,
    getServerDraftSnapshot
  );
  const [edited, setEdited] = useState<PostFormValue | null>(null);
  const [message, setMessage] = useState<EditorMessage | null>(null);
  const router = useRouter();

  const draftRestoredAt = restored?.savedAt ?? null;

  // まだ編集していない間は復元した下書きをそのまま表示する
  const value = edited ?? restored?.form ?? EMPTY_POST_FORM;

  // PostEditor は関数型アップデータを渡してくるので、表示中の値を基準に解決する
  const handleChange: Dispatch<SetStateAction<PostFormValue>> = (action) => {
    setEdited((prev) => {
      const base = prev ?? restored?.form ?? EMPTY_POST_FORM;
      return typeof action === "function" ? action(base) : action;
    });
  };

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
      onChange={handleChange}
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
                setEdited(EMPTY_POST_FORM);
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
