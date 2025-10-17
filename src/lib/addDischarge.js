import { createClient } from '@/lib/supabaseClient'
import { addAuditLog } from './addAuditLog'

export async function addDischarge(clientId, staffId, reason, notes) {
  const supabase = createClient()
  const { data, error } = await supabase.from('discharges').insert([
    { client_id: clientId, staff_id: staffId, reason, notes }
  ])

  if (!error) {
    await addAuditLog(staffId, 'discharge_client', clientId, { reason, notes })
  }
  return { data, error }
}
