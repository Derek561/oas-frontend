'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabaseClient'

export default function AuditPage() {
  const [logs, setLogs] = useState([])

  useEffect(() => {
    const supabase = createClient()

    const fetchLogs = async () => {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('user_id, action, target, details, created_at')
        .order('created_at', { ascending: false })
      if (error) console.error(error)
      else setLogs(data)
    }

    fetchLogs()
  }, [])

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Audit Trail</h1>

      <div className="overflow-x-auto bg-white rounded-lg shadow">
        <table className="min-w-full text-sm text-gray-700">
          <thead className="bg-gray-100 text-left font-semibold">
            <tr>
              <th className="py-3 px-4">Timestamp</th>
              <th className="py-3 px-4">User ID</th>
              <th className="py-3 px-4">Action</th>
              <th className="py-3 px-4">Target</th>
              <th className="py-3 px-4">Details</th>
            </tr>
          </thead>
          <tbody>
            {logs.length > 0 ? (
              logs.map((log) => (
                <tr key={log.created_at} className="border-t hover:bg-gray-50">
                  <td className="py-2 px-4">
                    {new Date(log.created_at).toLocaleString()}
                  </td>
                  <td className="py-2 px-4">{log.user_id || '-'}</td>
                  <td className="py-2 px-4 font-medium">{log.action}</td>
                  <td className="py-2 px-4">{log.target || '-'}</td>
                  <td className="py-2 px-4">
                    <pre className="whitespace-pre-wrap">
                      {JSON.stringify(log.details, null, 2)}
                    </pre>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="text-center py-6 text-gray-500">
                  No audit logs found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
