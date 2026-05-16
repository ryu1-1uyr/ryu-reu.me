import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "@/lib/env";

export function createMiddlewareSupabaseClient(
  request: NextRequest,
  response: NextResponse
) {
  return createServerClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );
}
