import { createClient } from '@supabase/supabase-js'

// Environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Safe Supabase instance
let supabase

if (typeof window !== 'undefined') {
  // ✅ Browser environment (localStorage is available)
  supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      storage: window.localStorage,
    },
  })
} else {
  // 🧠 Serverless (Netlify) environment — no localStorage
  supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
    },
  })
}

export { supabase }
