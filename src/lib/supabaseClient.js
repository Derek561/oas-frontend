import { createClient } from '@supabase/supabase-js'  // Import createClient correctly
// Get environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("⚠ Missing Supabase credentials!")
  throw new Error("Supabase environment variables are missing!")
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Log to verify it's working
console.log('✅ Supabase client initialized successfully')

export { supabase, createClient }  // Export supabase and createClient
