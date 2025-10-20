import { supabase } from '@/lib/supabaseClient'

export async function addAuditLog(action, details, staff_id) {
  const { error } = await supabase.from('audit_logs').insert([
    {
      action,
      details,
      staff_id,
      created_at: new Date(),
    },
  ])

  if (error) {
    console.error('Error adding audit log:', error.message)
    throw error
  }
}
