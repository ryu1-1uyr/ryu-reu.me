"use client";

import { useParams, notFound } from "next/navigation";
import { useState, useEffect, useSyncExternalStore } from "react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { usePostsCache } from "@/app/contexts/PostsCache";
import type { PostItem } from "@/app/components/PostListView";
import PageTransition from "@/app/components/PageTransition";
import BackButton from "@/app/components/BackButton";
import ShareButtons from "@/app/components/ShareButtons";
import TagChip from "@/app/components/TagChip";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";

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

  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // ログイン状態をチェック
  useEffect(() => {
    const supabase = createBrowserSupabaseClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      setIsLoggedIn(!!user);
    });
  }, []);

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
      <main className="bg-elements-background/80 backdrop-blur-sm min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-elements-paragraph/20 border-t-elements-button animate-spin" />
      </main>
    );
  }

  return (
    <PageTransition>
      <main className="bg-elements-background/80 backdrop-blur-sm min-h-screen px-6 py-12">
        <div className="max-w-3xl mx-auto">
          <BackButton />
          <h1 className="text-3xl font-bold mb-4 text-elements-headline">
            {post.title}
          </h1>
          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {post.tags.map((tag) => (
                <TagChip key={tag} tag={tag} size="md" />
              ))}
            </div>
          )}
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

          <div className="mt-3 flex justify-end items-center gap-2">
            {isLoggedIn && (
              <Link
                href={`/update/${encodeURIComponent(post.slug)}`}
                className="w-9 h-9 rounded-full bg-elements-headline flex items-center justify-center hover:opacity-80 transition-opacity group relative"
                aria-label="記事を編集"
              >
                <svg
                  viewBox="0 0 24 24"
                  className="w-4 h-4 fill-none stroke-gray-800 stroke-2"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"
                  />
                </svg>
                <span className="absolute right-full top-1/2 -translate-y-1/2 mr-2 px-2.5 py-1 rounded-md bg-elements-headline text-gray-800 text-xs whitespace-nowrap shadow-lg border border-gray-200 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                  編集する
                </span>
              </Link>
            )}
            <ShareButtons title={post.title} slug={post.slug} />
          </div>
        </div>
      </main>
    </PageTransition>
  );
}
