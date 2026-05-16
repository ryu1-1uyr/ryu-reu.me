import { NextRequest, NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { prisma } from "@/lib/prisma";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { checkCsrf } from "@/lib/csrf";
import { IS_DEV } from "@/lib/env";
import { normalizeTags } from "@/lib/tags";
import { parseUpdatePostBody } from "@/lib/validation";

const BUCKET = "blog-images";

// Supabase Storage の public URL から bucket 内パスを抽出
function extractStoragePath(url: string | null): string | null {
  if (!url) return null;
  const prefix = `/storage/v1/object/public/${BUCKET}/`;
  const idx = url.indexOf(prefix);
  if (idx === -1) return null;
  return url.slice(idx + prefix.length);
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug: rawSlug } = await params;
  const slug = decodeURIComponent(rawSlug);

  const post = await prisma.post.findUnique({
    where: { slug },
    include: { author: true, tags: { include: { tag: true } } },
  });

  if (!post || (!IS_DEV && !post.published)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({
    id: post.id,
    title: post.title,
    slug: post.slug,
    published: post.published,
    authorEmail: post.author.email,
    createdAt: post.createdAt,
    updatedAt: post.updatedAt,
    content: post.content,
    ogImage: post.ogImage,
    tags: post.tags.map((pt) => pt.tag.name),
  });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const csrfError = checkCsrf(request);
  if (csrfError) return csrfError;

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { slug: rawSlug } = await params;
  const slug = decodeURIComponent(rawSlug);

  const post = await prisma.post.findUnique({
    where: { slug },
    include: { author: true },
  });

  if (!post) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // 投稿者本人かチェック
  if (post.author.email !== user.email) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const parsed = parseUpdatePostBody(await request.json());
  if ("error" in parsed) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }
  const { title, content, published, tags, ogImage } = parsed;

  const normalizedTags = normalizeTags(tags);

  // 既存タグを一旦全削除して再作成
  const newOgImage = ogImage ?? null;
  const oldOgImage = post.ogImage;

  const updated = await prisma.$transaction(async (tx) => {
    await tx.postTag.deleteMany({ where: { postId: post.id } });

    return tx.post.update({
      where: { id: post.id },
      data: {
        title,
        content,
        ogImage: newOgImage,
        published: published !== false,
        tags: {
          create: normalizedTags.map((name) => ({
            tag: { connectOrCreate: { where: { name }, create: { name } } },
          })),
        },
      },
      include: { author: true, tags: { include: { tag: true } } },
    });
  });

  // 古い OG 画像が変更されてて、かつ og/ 配下なら Storage から削除（ベストエフォート）
  if (oldOgImage && oldOgImage !== newOgImage) {
    const oldPath = extractStoragePath(oldOgImage);
    if (oldPath && oldPath.startsWith("og/")) {
      await supabase.storage.from(BUCKET).remove([oldPath]);
      // 失敗は無視（DB 更新は既に成功してる）
    }
  }

  // キャッシュ破棄:
  // - トップの「最近の戯言」(tag: posts)
  // - 該当記事の詳細ページ（ISR）
  // - /blog 一覧（ISR）
  // Next.js 16+ では revalidateTag は第二引数に cacheLife profile が必須
  revalidateTag("posts", "max");
  revalidatePath(`/posts/${updated.slug}`);
  revalidatePath("/blog");

  // GET と同じ shape で返す（フロントが PUT 後に再 GET 不要に）
  return NextResponse.json({
    id: updated.id,
    title: updated.title,
    slug: updated.slug,
    published: updated.published,
    authorEmail: updated.author.email,
    createdAt: updated.createdAt,
    updatedAt: updated.updatedAt,
    content: updated.content,
    ogImage: updated.ogImage,
    tags: updated.tags.map((pt) => pt.tag.name),
  });
}
