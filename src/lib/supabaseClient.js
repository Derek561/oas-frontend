// ───────────────────────────────────────────────
// TRUTH BUILD: Supabase client with SSR support
// ───────────────────────────────────────────────
import { createBrowserClient } from "@supabase/ssr";

export const createClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn("⚠️ Supabase environment variables are missing!");
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey);
};
