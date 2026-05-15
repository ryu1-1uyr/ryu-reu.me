import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { renderMarkdown } from "@/lib/markdown";
import PageTransition from "@/app/components/PageTransition";
import BackButton from "@/app/components/BackButton";
import ShareButtons from "@/app/components/ShareButtons";
import TagChip from "@/app/components/TagChip";
import ProfileViewHintWriter from "@/app/_sections/AboutMe/ProfileViewHintWriter";
import EditButton from "./EditButton";
import TwitterEmbed from "./TwitterEmbed";

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
  const { html, lcpImageHint } = await renderMarkdown(post.content);

  const description = post.content
    .replace(/!\[.*?\]\(.*?\)/g, "")
    .replace(/<[^>]*>/g, "")
    .replace(/[#*`~>\-|]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 120);
  const isEngineerPost = tags.includes("技術");
  const siteUrl = "https://www.ryu-reu.me";
  const articleUrl = `${siteUrl}/posts/${post.slug}`;
  // 手動指定の OGP 画像があれば優先、無ければ /api/og で自動生成
  const ogImageUrl = post.ogImage
    ? post.ogImage
    : `${siteUrl}/api/og?title=${encodeURIComponent(post.title)}&desc=${encodeURIComponent(description)}${isEngineerPost ? "&avatar=engineer" : ""}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description,
    image: [ogImageUrl],
    datePublished: post.createdAt.toISOString(),
    dateModified: post.updatedAt.toISOString(),
    author: { "@type": "Person", name: "ReU" },
    publisher: {
      "@type": "Organization",
      name: "りゆうの実験場",
      logo: { "@type": "ImageObject", url: `${siteUrl}/me.png` },
    },
    mainEntityOfPage: { "@type": "WebPage", "@id": articleUrl },
    url: articleUrl,
    keywords: tags,
  };

  return (
    <PageTransition>
      {/* JSON-LD 構造化データ (BlogPosting) */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* 初訪問が技術タグ記事なら profile_view=engineer を刷り込む（Cookie 未設定時のみ） */}
      <ProfileViewHintWriter tags={tags} />
      {/* LCP 画像を <head> で preload — React 19 が自動で巻き上げる */}
      {lcpImageHint && (
        <link
          rel="preload"
          as="image"
          href={lcpImageHint.src}
          // @ts-expect-error -- React 19 は imagesrcset/imagesizes をサポートするが型定義が未追従
          imagesrcset={lcpImageHint.srcSet}
          imagesizes={lcpImageHint.sizes}
          fetchpriority="high"
        />
      )}
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
          <TwitterEmbed html={html} />

          <div className="mt-3 flex justify-end items-center gap-2">
            <EditButton slug={post.slug} />
            <ShareButtons title={post.title} slug={post.slug} />
          </div>
        </div>
      </main>
    </PageTransition>
  );
}
