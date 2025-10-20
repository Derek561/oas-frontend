'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { addAuditLog } from '@/lib/addAuditLog'
import { addDischarge } from '@/lib/addDischarge'

export default function DischargesPage() {
  const [client_id, setClientId] = useState('')
  const [reason, setReason] = useState('')
  const [notes, setNotes] = useState('')
  const [discharges, setDischarges] = useState([])

  useEffect(() => {
    async function fetchDischarges() {
      const { data, error } = await supabase
        .from('discharges')
        .select('*')
        .order('created_at', { ascending: false })
      if (!error) setDischarges(data || [])
    }
    fetchDischarges()
  }, [])

  async function handleAddDischarge(e) {
    e.preventDefault()
    const user = supabase.auth.getUser()
    if (!user) {
      alert('You must be logged in to record a discharge.')
      return
    }

    try {
      await addDischarge({ client_id, reason, notes })
      await addAuditLog('Discharge Added', `Client ${client_id}`, user.id)
      alert('Discharge recorded successfully.')
      setClientId('')
      setReason('')
      setNotes('')
    } catch (err) {
      console.error(err)
      alert('Error recording discharge.')
    }
  }

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-4">Client Discharges</h2>

      <form onSubmit={handleAddDischarge} className="space-y-2 mb-6">
        <input
          type="text"
          placeholder="Client ID"
          value={client_id}
          onChange={(e) => setClientId(e.target.value)}
          className="border p-2 w-full rounded"
        />
        <input
          type="text"
          placeholder="Reason for Discharge"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="border p-2 w-full rounded"
        />
        <textarea
          placeholder="Notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="border p-2 w-full rounded"
        />
        <button type="submit" className="bg-blue-500 text-white p-2 rounded">
          Add Discharge
        </button>
      </form>

      <table className="w-full border-collapse border border-gray-300">
        <thead>
          <tr className="bg-gray-100">
            <th className="border p-2">Date</th>
            <th className="border p-2">Client ID</th>
            <th className="border p-2">Reason</th>
            <th className="border p-2">Notes</th>
          </tr>
        </thead>
        <tbody>
          {discharges.map((d) => (
            <tr key={d.id}>
              <td className="border p-2">{new Date(d.created_at).toLocaleString()}</td>
              <td className="border p-2">{d.client_id}</td>
              <td className="border p-2">{d.reason}</td>
              <td className="border p-2">{d.notes}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
