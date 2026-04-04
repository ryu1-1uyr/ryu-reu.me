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
    metadataBase: new URL("https://www.ryu-reu.me"),
    title: post.title,
    description,
    keywords: [
      "りゆうの実験場",
      "reu-ryu",
      "ryu1__1uyR",
      "ReU_00_00",
      "ブログ",
      "技術記事",
      "お絵描き",
      "日記",
    ],
    openGraph: {
      type: "article",
      siteName: "りゆうの実験場",
      title: post.title,
      description,
      url: `/posts/${post.slug}`,
      locale: "ja_JP",
      images: [
        { url: IconImage.src, width: 400, height: 400, alt: post.title },
      ],
    },
    twitter: {
      card: "summary_large_image",
      site: "@reu_00_00",
      creator: "@reu_00_00",
      title: post.title,
      description,
      images: [IconImage.src],
    },
  };
}

export default function PostLayout({ children }: Props) {
  return <>{children}</>;
}
