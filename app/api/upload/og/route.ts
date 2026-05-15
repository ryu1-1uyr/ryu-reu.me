import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { checkCsrf } from "@/lib/csrf";

export const runtime = "nodejs";

const BUCKET = "blog-images";
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB（リサイズ前なので大きめOK）
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

const OG_WIDTH = 1200;
const OG_HEIGHT = 630;

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

  const formData = await request.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: `非対応の形式: ${file.type}（JPEG, PNG, WebP, GIF のみ）` },
      { status: 400 }
    );
  }

  if (file.size > MAX_FILE_SIZE) {
    const sizeMB = (file.size / 1024 / 1024).toFixed(1);
    return NextResponse.json(
      { error: `ファイルサイズが大きすぎ: ${sizeMB}MB（上限 10MB）` },
      { status: 400 }
    );
  }

  let processed: Buffer;
  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    processed = await sharp(buffer)
      .resize(OG_WIDTH, OG_HEIGHT, { fit: "cover", position: "center" })
      .webp({ quality: 85 })
      .toBuffer();
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown";
    return NextResponse.json(
      { error: `画像の加工に失敗: ${msg}` },
      { status: 500 }
    );
  }

  const timestamp = Date.now();
  const path = `og/${timestamp}.webp`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, processed, {
      contentType: "image/webp",
      upsert: false,
    });

  if (uploadError) {
    return NextResponse.json(
      { error: uploadError.message },
      { status: 500 }
    );
  }

  const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(path);

  return NextResponse.json({
    url: urlData.publicUrl,
    path,
    width: OG_WIDTH,
    height: OG_HEIGHT,
  });
}
