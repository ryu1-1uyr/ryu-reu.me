import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { checkCsrf } from "@/lib/csrf";

export async function POST(request: NextRequest) {
  const csrfError = checkCsrf(request);
  if (csrfError) return csrfError;

  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { title, content, published } = body;

  if (!title || !content) {
    return NextResponse.json(
      { error: "title, content are required" },
      { status: 400 }
    );
  }

  // タイトルから slug を自動生成（英数字+ハイフン+タイムスタンプで一意性担保）
  const baseSlug = title
    .toLowerCase()
    .replace(/[^a-z0-9\u3040-\u309f\u30a0-\u30ff\u4e00-\u9faf]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  const slug = `${baseSlug}-${Date.now()}`;

  // Supabase Auth の email から Prisma User を引く
  const prismaUser = await prisma.user.findUnique({
    where: { email: user.email! },
  });

  if (!prismaUser) {
    return NextResponse.json(
      { error: "対応する User レコードがないよ。Prisma に User を作ってね。" },
      { status: 400 }
    );
  }

  const post = await prisma.post.create({
    data: {
      title,
      slug,
      content,
      authorId: prismaUser.id,
      published: published !== false,
    },
  });

  return NextResponse.json({ id: post.id, slug: post.slug });
}
