"use client";

import { useParams, notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { usePostsCache } from "@/app/contexts/PostsCache";
import PageTransition from "@/app/components/PageTransition";
import BackButton from "@/app/components/BackButton";

export default function PostPage() {
  const { id } = useParams<{ id: string }>();
  const { posts } = usePostsCache();

  // id でキャッシュから検索（sessionStorage 復元 or トップ経由のいずれか）
  const post = posts.find((p) => p.id === id);

  if (!post) return notFound();

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
            <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
              {post.content}
            </ReactMarkdown>
          </article>
        </div>
      </main>
    </PageTransition>
  );
}
