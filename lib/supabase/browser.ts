import { createBrowserClient } from "@supabase/ssr";
import { env } from "@/lib/env";

export function createBrowserSupabaseClient() {
  return createBrowserClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY);
}
