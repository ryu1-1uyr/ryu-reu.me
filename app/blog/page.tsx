import type { Metadata } from "next";
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import { IS_DEV } from "@/lib/env";
import PostCard from "@/app/components/PostCard";
import Pagination from "@/app/components/Pagination";
import BackButton from "@/app/components/BackButton";
import PageTransition from "@/app/components/PageTransition";
import Link from "next/link";

export const metadata: Metadata = {
  title: "記事一覧",
  description: "りゆうのブログの記事一覧",
  alternates: { canonical: "/blog" },
  openGraph: {
    title: "記事一覧 | りゆうの実験場",
    description: "りゆうの実験場のブログ記事一覧",
    url: "/blog",
  },
};

const POSTS_PER_PAGE = 10;

// searchParams を読む時点でこのページは dynamic レンダリングになり、
// `export const revalidate`（ISR）は効かない。代わりに DB クエリを
// unstable_cache でキャッシュする（引数の page / tag が自動でキャッシュキーに入る）。
// 記事の publish/update 時は revalidateTag("posts") で即破棄、保険で1時間自動失効。
// unstable_cache は戻り値を JSON シリアライズするので Date は string になる。
// 消費側で混乱しないように、cache 内で明示的に ISO 文字列化しておく（feed.xml と同じ流儀）。
const getBlogPageData = unstable_cache(
  async (page: number, tag: string | undefined) => {
    const where = {
      ...(IS_DEV ? {} : { published: true as const }),
      ...(tag ? { tags: { some: { tag: { name: tag } } } } : {}),
    };

    const [posts, totalCount, allTags] = await Promise.all([
      prisma.post.findMany({
        where,
        orderBy: { createdAt: "desc" },
        include: { author: true, tags: { include: { tag: true } } },
        skip: (page - 1) * POSTS_PER_PAGE,
        take: POSTS_PER_PAGE,
      }),
      prisma.post.count({ where }),
      prisma.tag.findMany({
        where: IS_DEV ? {} : { posts: { some: { post: { published: true } } } },
        orderBy: { name: "asc" },
      }),
    ]);

    return {
      items: posts.map((post) => ({
        id: post.id,
        title: post.title,
        slug: post.slug,
        authorEmail: post.author.email,
        createdAt: post.createdAt.toISOString(),
        content: post.content,
        tags: post.tags.map((pt) => pt.tag.name),
      })),
      totalCount,
      allTags: allTags.map((t) => ({ id: t.id, name: t.name })),
    };
  },
  ["blog-page"],
  { revalidate: 3600, tags: ["posts"] }
);

export default async function BlogPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; tag?: string }>;
}) {
  const { page: pageParam, tag } = await searchParams;
  const currentPage = Math.max(1, parseInt(pageParam || "1", 10) || 1);

  const { items, totalCount, allTags } = await getBlogPageData(
    currentPage,
    tag
  );

  const totalPages = Math.ceil(totalCount / POSTS_PER_PAGE);

  const siteUrl = "https://www.ryu-reu.me";
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "ホーム", item: siteUrl },
      {
        "@type": "ListItem",
        position: 2,
        name: tag ? `記事一覧 - ${tag}` : "記事一覧",
        item: tag ? `${siteUrl}/blog?tag=${encodeURIComponent(tag)}` : `${siteUrl}/blog`,
      },
    ],
  };

  return (
    <PageTransition>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <main className="bg-elements-background/80 backdrop-blur-sm min-h-screen px-6 py-12">
        <div className="max-w-2xl mx-auto">
          <BackButton />
          <h1 className="text-2xl font-bold text-elements-headline mb-6">
            記事一覧
          </h1>

          {/* タグフィルタ */}
          {allTags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {/* タグリンクは明示的に押される前提なので prefetch off。
                  Next.js の prefetch={false} は viewport prefetch と hover prefetch
                  の両方を無効化する。クリック後の遷移は若干遅くなるが、タグ数増加時の
                  ネットワーク負荷を抑えるのが優先。 */}
              <Link
                href="/blog"
                prefetch={false}
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
                  prefetch={false}
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
                  createdAt={new Date(post.createdAt)}
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
