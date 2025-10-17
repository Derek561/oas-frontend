'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabaseClient'
import { addDischarge } from '@/lib/addDischarge'

export default function DischargesPage() {
  const supabase = createClient()
  const [discharges, setDischarges] = useState([])
  const [clientId, setClientId] = useState('')
  const [reason, setReason] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchDischarges()
  }, [])

  async function fetchDischarges() {
    const { data, error } = await supabase
      .from('discharges')
      .select('id, client_id, staff_id, discharge_date, reason, notes, created_at')
      .order('created_at', { ascending: false })
    if (error) console.error(error)
    else setDischarges(data)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)

    const { data: userData, error: userError } = await supabase.auth.getUser()
if (userError || !userData?.user) {
  alert('You must be logged in to record a discharge.')
  setLoading(false)
  return
}
const staff = userData.user
const { error } = await addDischarge(clientId, staff.id, reason, notes)

    if (error) console.error(error)
    else {
      setClientId('')
      setReason('')
      setNotes('')
      fetchDischarges()
    }

    setLoading(false)
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Client Discharges</h1>

      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-lg shadow p-4 mb-6 flex flex-col gap-3 max-w-lg"
      >
        <input
          type="text"
          placeholder="Client ID"
          value={clientId}
          onChange={(e) => setClientId(e.target.value)}
          required
          className="border p-2 rounded"
        />
        <input
          type="text"
          placeholder="Reason for Discharge"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          required
          className="border p-2 rounded"
        />
        <textarea
          placeholder="Notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="border p-2 rounded"
          rows="3"
        ></textarea>
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Saving...' : 'Add Discharge'}
        </button>
      </form>

      <div className="overflow-x-auto bg-white rounded-lg shadow">
        <table className="min-w-full text-sm text-gray-700">
          <thead className="bg-gray-100 text-left font-semibold">
            <tr>
              <th className="py-3 px-4">Date</th>
              <th className="py-3 px-4">Client ID</th>
              <th className="py-3 px-4">Staff ID</th>
              <th className="py-3 px-4">Reason</th>
              <th className="py-3 px-4">Notes</th>
            </tr>
          </thead>
          <tbody>
            {discharges.length > 0 ? (
              discharges.map((d) => (
                <tr key={d.id} className="border-t hover:bg-gray-50">
                  <td className="py-2 px-4">
                    {new Date(d.discharge_date).toLocaleDateString()}
                  </td>
                  <td className="py-2 px-4">{d.client_id}</td>
                  <td className="py-2 px-4">{d.staff_id}</td>
                  <td className="py-2 px-4 font-medium">{d.reason}</td>
                  <td className="py-2 px-4">{d.notes}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="text-center py-6 text-gray-500">
                  No discharges found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
