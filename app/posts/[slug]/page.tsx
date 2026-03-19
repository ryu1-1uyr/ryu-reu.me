"use client";

import { useParams, notFound } from "next/navigation";
import { useState, useEffect, useSyncExternalStore } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { usePostsCache } from "@/app/contexts/PostsCache";
import type { PostItem } from "@/app/components/PostListView/PostListView";
import PageTransition from "@/app/components/PageTransition";
import BackButton from "@/app/components/BackButton";

export default function PostPage() {
  const { slug: rawSlug } = useParams<{ slug: string }>();
  const slug = decodeURIComponent(rawSlug);
  const { posts } = usePostsCache();
  const [fetchedPost, setFetchedPost] = useState<PostItem | null>(null);
  const [notFoundState, setNotFoundState] = useState(false);

  // サーバーでは false、クライアントでは true を返す（ハイドレーション安全）
  const emptySubscribe = () => () => {};
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  const cachedPost = posts.find((p) => p.slug === slug);
  const post = cachedPost ?? fetchedPost;

  // マウント後、キャッシュになければ API から取得
  useEffect(() => {
    if (!mounted || cachedPost || fetchedPost) return;

    fetch(`/api/posts/${slug}`)
      .then((res) => {
        if (!res.ok) throw new Error("Not found");
        return res.json();
      })
      .then((data) => setFetchedPost(data))
      .catch(() => setNotFoundState(true));
  }, [slug, mounted, cachedPost, fetchedPost]);

  if (notFoundState) return notFound();

  if (!mounted || !post) {
    return (
      <main className="bg-elements-background min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-elements-paragraph/20 border-t-elements-button animate-spin" />
      </main>
    );
  }

  return (
    <PageTransition>
      <main className="bg-elements-background min-h-screen px-6 py-12">
        <div className="max-w-3xl mx-auto">
          <BackButton />
          <h1 className="text-3xl font-bold mb-4 text-elements-headline">
            {post.title}
          </h1>
          <div className="text-sm text-elements-paragraph mb-8 space-y-1">
            <p>
              作成日: {new Date(post.createdAt).toLocaleDateString("ja-JP")}
            </p>
            <p>
              更新日: {new Date(post.updatedAt).toLocaleDateString("ja-JP")}
            </p>
          </div>
          <article className="bg-elements-headline rounded-lg p-8 prose prose-neutral max-w-none">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeRaw]}
            >
              {post.content}
            </ReactMarkdown>
          </article>
        </div>
      </main>
    </PageTransition>
  );
}
