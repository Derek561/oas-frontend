import { createClient } from '@supabase/supabase-js';

// ✅ Load from environment variables (set in Netlify)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// 🧠 Basic safety check
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables.');
  throw new Error('Supabase URL or Anon Key not found in environment variables.');
}

// ✅ Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
