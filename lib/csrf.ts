import { NextRequest, NextResponse } from "next/server";

export function checkCsrf(request: NextRequest): NextResponse | null {
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");

  // Origin が存在する場合、host と一致するか確認
  if (origin) {
    const originUrl = new URL(origin);
    if (originUrl.host !== host) {
      return NextResponse.json(
        { error: "Forbidden: cross-origin request 出直してきな" },
        { status: 403 }
      );
    }
  }

  return null;
}
