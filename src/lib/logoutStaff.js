'use client'

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export async function logoutStaff(type = 'pin') {
  try {
    if (type === 'supabase') {
      await supabase.auth.signOut()
    } else {
      localStorage.removeItem('staff_session_id')
      localStorage.removeItem('staff_session_time')
    }
    console.log('✅ Staff successfully logged out.')
  } catch (err) {
    console.error('Error during logout:', err)
  }
}
