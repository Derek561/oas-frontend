'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

export default function MaintenancePage() {
  const [requests, setRequests] = useState([])

  useEffect(() => {
    async function fetchRequests() {
      const { data, error } = await supabase
        .from('maintenance')
        .select('*')
        .order('created_at', { ascending: false })
      if (!error) setRequests(data || [])
    }
    fetchRequests()
  }, [])

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-4">Maintenance Requests</h2>
      <table className="w-full border-collapse border border-gray-300">
        <thead>
          <tr className="bg-gray-100">
            <th className="border p-2">Date</th>
            <th className="border p-2">Request</th>
            <th className="border p-2">Status</th>
          </tr>
        </thead>
        <tbody>
          {requests.map((r) => (
            <tr key={r.id}>
              <td className="border p-2">{new Date(r.created_at).toLocaleString()}</td>
              <td className="border p-2">{r.description}</td>
              <td className="border p-2">{r.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
