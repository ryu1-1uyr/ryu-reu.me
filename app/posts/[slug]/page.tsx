import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { renderMarkdown } from "@/lib/markdown";
import PageTransition from "@/app/components/PageTransition";
import BackButton from "@/app/components/BackButton";
import ShareButtons from "@/app/components/ShareButtons";
import TagChip from "@/app/components/TagChip";

type Props = { params: Promise<{ slug: string }> };

export default async function PostPage({ params }: Props) {
  const { slug: rawSlug } = await params;
  const slug = decodeURIComponent(rawSlug);

  const post = await prisma.post.findUnique({
    where: { slug },
    include: { author: true, tags: { include: { tag: true } } },
  });

  const isDev = process.env.NODE_ENV === "development";
  if (!post || (!isDev && !post.published)) {
    notFound();
  }

  const tags = post.tags.map((pt) => pt.tag.name);
  const html = await renderMarkdown(post.content);

  return (
    <PageTransition>
      <main className="bg-elements-background/80 backdrop-blur-sm min-h-screen px-6 py-12">
        <div className="max-w-3xl mx-auto">
          <BackButton />
          <h1 className="text-3xl font-bold mb-4 text-elements-headline">
            {post.title}
          </h1>
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {tags.map((tag) => (
                <TagChip key={tag} tag={tag} size="md" />
              ))}
            </div>
          )}
          <div className="text-sm text-elements-paragraph mb-8 space-y-1">
            <p>
              作成日: {post.createdAt.toLocaleDateString("ja-JP")}
            </p>
            <p>
              更新日: {post.updatedAt.toLocaleDateString("ja-JP")}
            </p>
          </div>
          <article
            className="bg-elements-headline rounded-lg p-8 prose prose-neutral max-w-none"
            dangerouslySetInnerHTML={{ __html: html }}
          />

          <div className="mt-3 flex justify-end items-center gap-2">
            {/* TODO: 1-3 で EditButton (Client Component) として復活させる */}
            <ShareButtons title={post.title} slug={post.slug} />
          </div>
        </div>
      </main>
    </PageTransition>
  );
}
