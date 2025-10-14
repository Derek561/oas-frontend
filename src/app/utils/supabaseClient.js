import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,            // keeps user logged in on refresh
    autoRefreshToken: true,          // automatically refreshes expired tokens
    detectSessionInUrl: true,        // enables magic link redirect detection
    storageKey: 'ohs-session',       // custom key to avoid overwriting across apps
  },
})
