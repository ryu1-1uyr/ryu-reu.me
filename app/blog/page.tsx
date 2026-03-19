import { prisma } from "@/lib/prisma";
import PostCard from "@/app/components/PostCard";
import Pagination from "@/app/components/Pagination";
import BackButton from "@/app/components/BackButton";
import PageTransition from "@/app/components/PageTransition";

const POSTS_PER_PAGE = 10;
const isDev = process.env.NODE_ENV === "development";

export default async function BlogPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageParam } = await searchParams;
  const currentPage = Math.max(1, parseInt(pageParam || "1", 10) || 1);

  const where = isDev ? undefined : { published: true as const };
  const [posts, totalCount] = await Promise.all([
    prisma.post.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: { author: true },
      skip: (currentPage - 1) * POSTS_PER_PAGE,
      take: POSTS_PER_PAGE,
    }),
    prisma.post.count({ where }),
  ]);

  const totalPages = Math.ceil(totalCount / POSTS_PER_PAGE);

  const items = posts.map((post) => ({
    id: post.id,
    title: post.title,
    slug: post.slug,
    authorEmail: post.author.email,
    createdAt: post.createdAt,
    content: post.content,
  }));

  return (
    <PageTransition>
      <main className="bg-elements-background min-h-screen px-6 py-12">
        <div className="max-w-2xl mx-auto">
          <BackButton />
          <h1 className="text-2xl font-bold text-elements-headline mb-6">
            記事一覧
          </h1>

          {items.length === 0 ? (
            <p className="text-center text-elements-paragraph py-12">
              記事がまだありません
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
                />
              ))}
            </div>
          )}

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            basePath="/blog"
          />
        </div>
      </main>
    </PageTransition>
  );
}
