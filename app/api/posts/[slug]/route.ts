import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { checkCsrf } from "@/lib/csrf";

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

  const isDev = process.env.NODE_ENV === "development";
  if (!post || (!isDev && !post.published)) {
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

  const body = await request.json();
  const { title, content, published, tags } = body as {
    title?: string;
    content?: string;
    published?: boolean;
    tags?: string[];
  };

  if (!title || !content) {
    return NextResponse.json(
      { error: "title, content are required" },
      { status: 400 }
    );
  }

  // タグの正規化
  const normalizedTags = tags
    ? [...new Set(tags.map((t) => t.trim().normalize("NFKC")).filter(Boolean))]
    : [];

  // 既存タグを一旦全削除して再作成
  const updated = await prisma.$transaction(async (tx) => {
    await tx.postTag.deleteMany({ where: { postId: post.id } });

    return tx.post.update({
      where: { id: post.id },
      data: {
        title,
        content,
        published: published !== false,
        tags: {
          create: normalizedTags.map((name) => ({
            tag: { connectOrCreate: { where: { name }, create: { name } } },
          })),
        },
      },
    });
  });

  return NextResponse.json({ id: updated.id, slug: updated.slug });
}
