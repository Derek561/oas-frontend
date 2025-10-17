'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

export default function ClientsPage() {
  const [clients, setClients] = useState([])

  useEffect(() => {
    async function fetchClients() {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('last_name', { ascending: true })
      if (!error) setClients(data || [])
    }
    fetchClients()
  }, [])

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-4">Clients</h2>
      <table className="w-full border-collapse border border-gray-300">
        <thead>
          <tr className="bg-gray-100">
            <th className="border p-2">First Name</th>
            <th className="border p-2">Last Name</th>
            <th className="border p-2">Admission Date</th>
          </tr>
        </thead>
        <tbody>
          {clients.map((c) => (
            <tr key={c.id}>
              <td className="border p-2">{c.first_name}</td>
              <td className="border p-2">{c.last_name}</td>
              <td className="border p-2">{new Date(c.admission_date).toLocaleDateString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
