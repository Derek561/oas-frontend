// src/lib/supabaseClient.js
// ───────────────────────────────────────────────
// TRUTH BUILD: Verified environment-safe Supabase client
// ───────────────────────────────────────────────

import { createClient as createSupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Runtime safety check
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("⚠️ Supabase environment variables are missing!");
}

export function createClient() {
  return createSupabaseClient(supabaseUrl, supabaseAnonKey);
}
