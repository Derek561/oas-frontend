import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Prevent Netlify server runtime from crashing by checking for 'window'
let supabase

if (typeof window !== 'undefined') {
  // Browser environment: normal Supabase client
  supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      storage: window.localStorage,
    },
  })
} else {
  // Server environment (Netlify, SSR)
  supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
    },
  })
}

export { supabase }
