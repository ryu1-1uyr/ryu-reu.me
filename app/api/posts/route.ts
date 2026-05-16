import { NextRequest, NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { checkCsrf } from "@/lib/csrf";
import { generateSlug } from "@/lib/slug";
import { normalizeTags } from "@/lib/tags";
import { parsePostBody } from "@/lib/validation";

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

  const parsed = parsePostBody(await request.json());
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }
  const { title, content, published, tags, ogImage } = parsed.data;

  // タイトルから slug を自動生成（英数字+ハイフン+タイムスタンプで一意性担保）
  const slug = generateSlug(title);

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

  const normalizedTags = normalizeTags(tags);

  const post = await prisma.post.create({
    data: {
      title,
      slug,
      content,
      ogImage: ogImage ?? null,
      authorId: prismaUser.id,
      published: published !== false,
      tags: {
        create: normalizedTags.map((name) => ({
          tag: { connectOrCreate: { where: { name }, create: { name } } },
        })),
      },
    },
  });

  // キャッシュ破棄: トップの「最近の戯言」、/blog 一覧、/feed.xml を更新
  // Next.js 16+ では revalidateTag は第二引数に cacheLife profile が必須
  revalidateTag("posts", "max");
  revalidatePath("/blog");
  revalidatePath("/feed.xml");

  // 新規記事は generateStaticParams に含まれていないため、ISR の動的生成パスを通る。
  // 日本語 slug の場合 Next.js が x-next-cache-tags ヘッダー処理で 500 を出すので、
  // Deploy Hook を fire-and-forget でキックして再ビルド → SSG されるようにする。
  // ※ 既存記事の編集 (PUT) には不要（既に SSG 済みのため）。
  const hookUrl = process.env.VERCEL_DEPLOY_HOOK_URL;
  if (hookUrl) {
    fetch(hookUrl, { method: "POST" }).catch((err) => {
      console.error("Deploy hook failed:", err);
    });
  }

  return NextResponse.json({ id: post.id, slug: post.slug });
}
