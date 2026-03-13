import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { prisma } from "@/lib/prisma";
import PageTransition from "@/app/components/PageTransition";
import BackButton from "@/app/components/BackButton";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function PostPage({ params }: Props) {
  const { id } = await params;

  const post = await prisma.post.findUnique({
    where: { id },
    include: { author: true },
  });

  if (!post) notFound();

  return (
    <PageTransition>
      <main className="bg-elements-background min-h-screen px-6 py-12">
        <div className="max-w-3xl mx-auto">
          <BackButton />
          <h1 className="text-3xl font-bold mb-4 text-elements-headline">
            {post.title}
          </h1>
          <div className="text-sm text-elements-paragraph mb-8 space-y-1">
            <p>作成日: {new Date(post.createdAt).toLocaleDateString("ja-JP")}</p>
            <p>更新日: {new Date(post.updatedAt).toLocaleDateString("ja-JP")}</p>
          </div>
          <article className="bg-elements-headline rounded-lg p-8 prose prose-neutral max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {post.content}
            </ReactMarkdown>
          </article>
        </div>
      </main>
    </PageTransition>
  );
}
