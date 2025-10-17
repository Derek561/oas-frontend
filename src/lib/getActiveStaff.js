'use client'

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

// Save staff session to localStorage (for PIN logins)
export function saveStaffSession(sessionId) {
  localStorage.setItem('staff_session_id', sessionId)
  localStorage.setItem('staff_session_time', Date.now().toString())
}

// Get active staff (for both admin and PIN logins)
export async function getActiveStaff() {
  try {
    // Step 1: Supabase Auth (Admin)
    const { data: { user } } = await supabase.auth.getUser()
    if (user && user.email) {
      return {
        name: user.email,
        role: 'Admin',
        session_type: 'supabase',
      }
    }

    // Step 2: Local PIN session
    const sessionId = localStorage.getItem('staff_session_id')
    if (!sessionId) return null

    const { data, error } = await supabase
      .from('staff_sessions')
      .select('*, staff:staff_id ( name, role )')
      .eq('id', sessionId)
      .single()

    if (error || !data) return null

    return {
      name: data.staff.name,
      role: data.staff.role,
      session_type: 'pin',
      session_id: sessionId,
    }
  } catch (err) {
    console.error('Error fetching active staff:', err)
    return null
  }
}
