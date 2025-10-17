'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

export default function AuditPage() {
  const [logs, setLogs] = useState([])

  useEffect(() => {
    async function fetchLogs() {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
      if (!error) setLogs(data || [])
    }
    fetchLogs()
  }, [])

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-4">Audit Trail</h2>
      <table className="w-full border-collapse border border-gray-300">
        <thead>
          <tr className="bg-gray-100">
            <th className="border p-2">Date</th>
            <th className="border p-2">Action</th>
            <th className="border p-2">Staff ID</th>
            <th className="border p-2">Details</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log) => (
            <tr key={log.id}>
              <td className="border p-2">{new Date(log.created_at).toLocaleString()}</td>
              <td className="border p-2">{log.action}</td>
              <td className="border p-2">{log.staff_id}</td>
              <td className="border p-2">{log.details}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
