"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import PostEditor, {
  EMPTY_POST_FORM,
  type PostFormValue,
  type EditorMessage,
} from "@/app/components/PostEditor";

export default function UpdatePage() {
  const { slug: rawSlug } = useParams<{ slug: string }>();
  const slug = decodeURIComponent(rawSlug);
  const router = useRouter();

  const [value, setValue] = useState<PostFormValue>(EMPTY_POST_FORM);
  const [message, setMessage] = useState<EditorMessage | null>(null);
  const [loading, setLoading] = useState(true);

  // 既存記事を取得してフォームに反映
  useEffect(() => {
    fetch(`/api/posts/${encodeURIComponent(slug)}`)
      .then((res) => {
        if (res.status === 401) {
          router.push("/login");
          return null;
        }
        if (!res.ok) throw new Error("Not found");
        return res.json();
      })
      .then((data) => {
        if (!data) return;
        setValue({
          title: data.title,
          content: data.content,
          published: data.published,
          tags: data.tags ?? [],
          ogImage: data.ogImage ?? null,
        });
      })
      .catch(() => {
        setMessage({ type: "error", text: "記事の取得に失敗したよ" });
      })
      .finally(() => setLoading(false));
  }, [slug, router]);

  const handleSave = async (v: PostFormValue) => {
    try {
      const res = await fetch(`/api/posts/${encodeURIComponent(slug)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(v),
      });

      if (res.status === 401) {
        router.push("/login");
        return;
      }
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setMessage({ type: "success", text: "記事を更新したよ" });
    } catch (err) {
      setMessage({
        type: "error",
        text: `更新失敗: ${err instanceof Error ? err.message : "unknown"}`,
      });
    }
  };

  if (loading) {
    return (
      <main className="bg-elements-background/80 backdrop-blur-sm min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-elements-paragraph/20 border-t-elements-button animate-spin" />
      </main>
    );
  }

  return (
    <PostEditor
      heading="記事を編集"
      value={value}
      onChange={setValue}
      onSave={handleSave}
      saveLabel="記事を更新"
      savingLabel="更新中..."
      message={message}
      onMessage={setMessage}
    />
  );
}
