import { createClient } from '@supabase/supabase-js'
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

/**
 * Logs in a staff member via PIN.
 * @param {string} pin - 4-digit staff PIN.
 * @returns {object} staff_session data or error message.
 */
export async function staffPinLogin(pin) {
  const { data, error } = await supabase.rpc('staff_pin_login', { pin })

  if (error) {
    console.error('PIN login failed:', error.message)
    return { error: error.message }
  }

  console.log('Login success:', data)
  return { sessionId: data }
}

/**
 * Logs out a staff member by session ID.
 */
export async function staffPinLogout(sessionId) {
  const { error } = await supabase.rpc('staff_pin_logout', { session: sessionId })
  if (error) console.error('Logout failed:', error.message)
}
