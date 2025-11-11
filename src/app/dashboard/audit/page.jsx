'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

export default function AuditPage() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(null)

  useEffect(() => {
    async function fetchLogs() {
      const { data, error } = await supabase
        .from('audit_logs')
        .select(`
          id,
          created_at,
          action,
          details,
          staff:staff_id ( name, role, email )
        `)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching audit logs:', error)
        setLogs([])
      } else {
        setLogs(data || [])
      }
      setLoading(false)
    }

    fetchLogs()
  }, [])

  if (loading)
    return <div className="p-6 text-gray-500">Loading audit records...</div>

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-xl font-semibold text-gray-900">Audit Trail</h2>

      <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-left text-gray-600 border-b">
              <th className="px-4 py-3 font-medium w-44">Date</th>
              <th className="px-4 py-3 font-medium w-56">Action</th>
              <th className="px-4 py-3 font-medium w-56">Staff</th>
              <th className="px-4 py-3 font-medium">Details</th>
            </tr>
          </thead>

          <tbody>
            {logs.length > 0 ? (
              logs.map((log, i) => {
                const formattedDate = log.created_at
                  ? new Date(log.created_at).toLocaleString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                      hour12: true,
                    })
                  : '—'

                return (
                  <tr
                    key={log.id}
                    className={`border-t transition-colors ${
                      i % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                    } hover:bg-gray-100`}
                  >
                    <td className="px-4 py-3 text-gray-800 whitespace-nowrap">
                      {formattedDate}
                    </td>

                    <td className="px-4 py-3 text-gray-900 font-medium">
                      {log.action || '—'}
                    </td>

                    <td className="px-4 py-3 text-gray-700">
                      {log.staff?.name || '—'}
                      {log.staff?.role && (
                        <div className="text-xs text-gray-500">
                          {log.staff.role}
                        </div>
                      )}
                    </td>

                    <td className="px-4 py-3 text-gray-700">
                      <button
                        onClick={() =>
                          setExpanded(expanded === log.id ? null : log.id)
                        }
                        className="text-blue-600 hover:underline text-sm"
                      >
                        {expanded === log.id ? 'Hide Details' : 'View Details'}
                      </button>

                      {expanded === log.id && (
                        <div className="mt-2 bg-gray-50 border border-gray-100 rounded-md p-3 text-xs text-gray-800 font-mono whitespace-pre-wrap transition-all duration-200 ease-in-out">
                          {renderDetails(log.details)}
                        </div>
                      )}
                    </td>
                  </tr>
                )
              })
            ) : (
              <tr>
                <td
                  colSpan="4"
                  className="text-center p-4 text-gray-500 text-sm italic"
                >
                  No audit entries found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function renderDetails(details) {
  try {
    if (!details) return '—'
    const parsed =
      typeof details === 'string' ? JSON.parse(details) : details
    return JSON.stringify(parsed, null, 2)
  } catch {
    return typeof details === 'string' ? details : JSON.stringify(details)
  }
}
