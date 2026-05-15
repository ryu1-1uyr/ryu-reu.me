import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";

type Props = {
  params: Promise<{ slug: string }>;
  children: React.ReactNode;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug: rawSlug } = await params;
  const slug = decodeURIComponent(rawSlug);

  const post = await prisma.post.findUnique({
    where: { slug },
    include: { tags: { include: { tag: true } } },
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

  // OGP 画像: 手動指定があればそれを優先、無ければ /api/og で自動生成
  // 自動生成側では、技術タグが付いていれば engineer 版（ryu.jpg）アバターに切替
  const tagNames = post.tags.map((t) => t.tag.name);
  const isEngineerPost = tagNames.includes("技術");
  const ogImageUrl = post.ogImage
    ? post.ogImage
    : `/api/og?title=${encodeURIComponent(post.title)}&desc=${encodeURIComponent(description)}${isEngineerPost ? "&avatar=engineer" : ""}`;

  return {
    metadataBase: new URL("https://www.ryu-reu.me"),
    title: post.title,
    description,
    alternates: { canonical: `/posts/${post.slug}` },
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
      images: [{ url: ogImageUrl, width: 1200, height: 630, alt: post.title }],
    },
    twitter: {
      card: "summary_large_image",
      site: "@reu_00_00",
      creator: "@reu_00_00",
      title: post.title,
      description,
      images: [ogImageUrl],
    },
  };
}

export default function PostLayout({ children }: Props) {
  return <>{children}</>;
}
