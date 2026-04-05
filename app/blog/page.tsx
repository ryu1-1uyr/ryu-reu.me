import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import PostCard from "@/app/components/PostCard";
import Pagination from "@/app/components/Pagination";
import BackButton from "@/app/components/BackButton";
import PageTransition from "@/app/components/PageTransition";
import Link from "next/link";

export const metadata: Metadata = {
  title: "記事一覧",
  description: "りゆうのブログの記事一覧",
  openGraph: {
    title: "記事一覧 | りゆうの実験場",
    description: "りゆうの実験場のブログ記事一覧",
    url: "/blog",
  },
};

export const revalidate = 3600; // 1時間キャッシュ（ISR）

const POSTS_PER_PAGE = 10;
const isDev = process.env.NODE_ENV === "development";

export default async function BlogPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; tag?: string }>;
}) {
  const { page: pageParam, tag } = await searchParams;
  const currentPage = Math.max(1, parseInt(pageParam || "1", 10) || 1);

  const where = {
    ...(isDev ? {} : { published: true as const }),
    ...(tag ? { tags: { some: { tag: { name: tag } } } } : {}),
  };

  const [posts, totalCount, allTags] = await Promise.all([
    prisma.post.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: { author: true, tags: { include: { tag: true } } },
      skip: (currentPage - 1) * POSTS_PER_PAGE,
      take: POSTS_PER_PAGE,
    }),
    prisma.post.count({ where }),
    prisma.tag.findMany({
      where: isDev ? {} : { posts: { some: { post: { published: true } } } },
      orderBy: { name: "asc" },
    }),
  ]);

  const totalPages = Math.ceil(totalCount / POSTS_PER_PAGE);

  const items = posts.map((post) => ({
    id: post.id,
    title: post.title,
    slug: post.slug,
    authorEmail: post.author.email,
    createdAt: post.createdAt,
    content: post.content,
    tags: post.tags.map((pt) => pt.tag.name),
  }));

  return (
    <PageTransition>
      <main className="bg-elements-background/80 backdrop-blur-sm min-h-screen px-6 py-12">
        <div className="max-w-2xl mx-auto">
          <BackButton />
          <h1 className="text-2xl font-bold text-elements-headline mb-6">
            記事一覧
          </h1>

          {/* タグフィルタ */}
          {allTags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              <Link
                href="/blog"
                className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                  !tag
                    ? "bg-elements-button text-elements-background border-elements-button"
                    : "border-elements-button/30 text-elements-paragraph hover:bg-elements-button/10 hover:text-elements-button"
                }`}
              >
                すべて
              </Link>
              {allTags.map((t) => (
                <Link
                  key={t.id}
                  href={`/blog?tag=${encodeURIComponent(t.name)}`}
                  className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                    tag === t.name
                      ? "bg-elements-button text-elements-background border-elements-button"
                      : "border-elements-button/30 text-elements-paragraph hover:bg-elements-button/10 hover:text-elements-button"
                  }`}
                >
                  {t.name}
                </Link>
              ))}
            </div>
          )}

          {items.length === 0 ? (
            <p className="text-center text-elements-paragraph py-12">
              {tag
                ? `「${tag}」の記事はまだないみたい`
                : "記事がまだありません"}
            </p>
          ) : (
            <div className="space-y-4">
              {items.map((post) => (
                <PostCard
                  key={post.id}
                  id={post.id}
                  slug={post.slug}
                  title={post.title}
                  authorEmail={post.authorEmail}
                  createdAt={post.createdAt}
                  content={post.content}
                  tags={post.tags}
                />
              ))}
            </div>
          )}

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            basePath="/blog"
            {...(tag ? { extraParams: { tag } } : {})}
          />
        </div>
      </main>
    </PageTransition>
  );
}
