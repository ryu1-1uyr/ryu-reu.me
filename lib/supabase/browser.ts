import { createBrowserClient } from "@supabase/ssr";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "@/lib/env";

export function createBrowserSupabaseClient() {
  return createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}
