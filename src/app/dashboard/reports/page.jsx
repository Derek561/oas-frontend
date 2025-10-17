'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

export default function ReportsPage() {
  const [reports, setReports] = useState([])

  useEffect(() => {
    async function fetchReports() {
      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .order('created_at', { ascending: false })
      if (!error) setReports(data || [])
    }
    fetchReports()
  }, [])

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-4">Reports</h2>
      <table className="w-full border-collapse border border-gray-300">
        <thead>
          <tr className="bg-gray-100">
            <th className="border p-2">Date</th>
            <th className="border p-2">Title</th>
            <th className="border p-2">Submitted By</th>
          </tr>
        </thead>
        <tbody>
          {reports.map((r) => (
            <tr key={r.id}>
              <td className="border p-2">{new Date(r.created_at).toLocaleString()}</td>
              <td className="border p-2">{r.title}</td>
              <td className="border p-2">{r.staff_id}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
