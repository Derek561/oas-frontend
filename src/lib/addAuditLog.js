import { createClient } from '@/lib/supabaseClient'

export async function addAuditLog(userId, action, target = null, details = {}) {
  const supabase = createClient()
  await supabase.from('audit_logs').insert([
    { user_id: userId, action, target, details }
  ])
}
