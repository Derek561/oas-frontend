import { supabase } from '@/lib/supabaseClient'

export async function addDischarge(dischargeData) {
  const { data, error } = await supabase
    .from('discharges')
    .insert([dischargeData])

  if (error) {
    console.error('Error adding discharge:', error.message)
    throw error
  }

  return data
}
