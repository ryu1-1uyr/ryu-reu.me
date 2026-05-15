import "server-only";

import { cache } from "react";
import { prisma } from "@/lib/prisma";

/**
 * slug から Post を取得する。
 * React の cache() でラップしているので、同一リクエスト内（例えば layout の
 * generateMetadata と page の本体）で同じ slug を渡せば DB アクセスは1回で済む。
 */
export const getPostBySlug = cache(async (slug: string) => {
  return prisma.post.findUnique({
    where: { slug },
    include: { author: true, tags: { include: { tag: true } } },
  });
});

/**
 * published な全記事の slug 一覧を取得する。
 * 主に generateStaticParams (ビルド時の SSG) で使う。
 */
export async function getAllPublishedSlugs(): Promise<string[]> {
  const posts = await prisma.post.findMany({
    where: { published: true },
    select: { slug: true },
  });
  return posts.map(({ slug }) => slug);
}
