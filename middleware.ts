import { NextRequest, NextResponse } from "next/server";
import { createMiddlewareSupabaseClient } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  const response = NextResponse.next({ request });
  const supabase = createMiddlewareSupabaseClient(request, response);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // 未認証で /upload にアクセス → /login に飛ばす
  if (!user && pathname.startsWith("/upload")) {
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
  matcher: ["/upload/:path*", "/login"],
};
