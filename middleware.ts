import { NextRequest, NextResponse } from "next/server";
import { createMiddlewareSupabaseClient } from "@/lib/supabase/middleware";
import { resolveProfileView } from "@/app/_sections/AboutMe/resolveProfileView";

const PROFILE_COOKIE = "profile_view";
const PROFILE_COOKIE_MAX_AGE = 60 * 60 * 24 * 180; // 180日

export async function middleware(request: NextRequest) {
  const response = NextResponse.next({ request });
  const { pathname } = request.nextUrl;

  // プロフィール出し分け判定（ホームのみ）。
  // ここでは認証情報を使わないので supabase.auth.getUser() は呼ばない。
  // getUser() は Supabase Auth サーバーへのネットワーク往復が発生するため、
  // 呼ぶと全トップページアクセスの TTFB にそのまま乗ってしまう。
  if (pathname === "/") {
    const queryAs = request.nextUrl.searchParams.get("as");
    const cookieAs = request.cookies.get(PROFILE_COOKIE)?.value;
    const referer = request.headers.get("referer");

    const resolved = resolveProfileView({
      query: queryAs,
      cookie: cookieAs,
      referer,
    });

    if (resolved !== cookieAs) {
      response.cookies.set(PROFILE_COOKIE, resolved, {
        maxAge: PROFILE_COOKIE_MAX_AGE,
        sameSite: "lax",
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        path: "/",
      });
    }

    return response;
  }

  // ここから先（/upload, /update, /login）は認証状態が必要
  const supabase = createMiddlewareSupabaseClient(request, response);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 未認証で /upload, /update にアクセス → /login に飛ばす
  if (!user && (pathname.startsWith("/upload") || pathname.startsWith("/update"))) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    return NextResponse.redirect(loginUrl);
  }

  // 認証済みで /login にアクセス → /upload に飛ばす
  if (user && pathname === "/login") {
    const uploadUrl = request.nextUrl.clone();
    uploadUrl.pathname = "/upload";
    return NextResponse.redirect(uploadUrl);
  }

  return response;
}

export const config = {
  matcher: ["/", "/upload/:path*", "/update/:path*", "/login"],
};
