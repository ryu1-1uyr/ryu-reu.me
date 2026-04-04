import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import IconImage from "@/public/me.png";

type Props = {
  params: Promise<{ slug: string }>;
  children: React.ReactNode;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug: rawSlug } = await params;
  const slug = decodeURIComponent(rawSlug);

  const post = await prisma.post.findUnique({
    where: { slug },
    select: { title: true, content: true, slug: true },
  });

  if (!post) {
    return { title: "記事が見つかりません" };
  }

  const description = post.content
    .replace(/!\[.*?\]\(.*?\)/g, "")
    .replace(/<[^>]*>/g, "")
    .replace(/[#*`~>\-|]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 120);

  return {
    title: post.title,
    description,
    openGraph: {
      type: "article",
      title: post.title,
      description,
      url: `/posts/${post.slug}`,
      images: [{ url: IconImage.src, width: 400, height: 400, alt: post.title }],
    },
    twitter: {
      card: "summary",
      title: post.title,
      description,
      images: [IconImage.src],
    },
  };
}

export default function PostLayout({ children }: Props) {
  return <>{children}</>;
}
