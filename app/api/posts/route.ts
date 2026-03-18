import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { title, slug, content, authorId } = body;

  if (!title || !slug || !content) {
    return NextResponse.json(
      { error: "title, slug, content are required" },
      { status: 400 }
    );
  }

  // authorId が未指定なら最初のユーザーを使う（プロトタイプ用）
  let resolvedAuthorId = authorId;
  if (!resolvedAuthorId) {
    const firstUser = await prisma.user.findFirst();
    if (!firstUser) {
      return NextResponse.json(
        { error: "No user found. Create a user first." },
        { status: 400 }
      );
    }
    resolvedAuthorId = firstUser.id;
  }

  const post = await prisma.post.create({
    data: {
      title,
      slug,
      content,
      authorId: resolvedAuthorId,
      published: true,
    },
  });

  return NextResponse.json({ id: post.id, slug: post.slug });
}
