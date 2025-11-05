'use client';

import { useEffect, useState } from 'react';
import supabase from '@/lib/supabaseClient';

export default function AuditPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch audit trail data
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
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching audit logs:', error);
        setLogs([]);
      } else {
        setLogs(data || []);
      }
      setLoading(false);
    }

    fetchLogs();
  }, []);

  if (loading) {
    return <div className="p-6 text-gray-500">Loading audit records...</div>;
  }

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-4">🧾 Audit Trail</h2>

      <table className="w-full border-collapse border border-gray-300">
        <thead>
          <tr className="bg-gray-100">
            <th className="border p-2">Date</th>
            <th className="border p-2">Action</th>
            <th className="border p-2">Staff</th>
            <th className="border p-2">Details</th>
          </tr>
        </thead>

        <tbody>
          {logs.length > 0 ? (
            logs.map((log) => (
              <tr key={log.id} className="hover:bg-gray-50">
                <td className="border p-2 text-sm">
                  {log.created_at
                    ? new Date(log.created_at).toLocaleString()
                    : '—'}
                </td>

                <td className="border p-2 text-sm">{log.action ?? '—'}</td>

                <td className="border p-2 text-sm">
                  {log.staff?.name ||
                    log.staff_name ||
                    (log.staff_id ? `ID: ${log.staff_id}` : '—')}
                  {log.staff?.role ? (
                    <div className="text-xs text-gray-500">{log.staff.role}</div>
                  ) : null}
                </td>

                <td className="border p-2 text-sm break-all">
                  {(() => {
                    if (!log.details) return '—';
                    try {
                      const parsed =
                        typeof log.details === 'string'
                          ? JSON.parse(log.details)
                          : log.details;
                      return (
                        <pre className="text-xs text-gray-600 whitespace-pre-wrap">
                          {JSON.stringify(parsed, null, 2)}
                        </pre>
                      );
                    } catch {
                      return (
                        <span className="text-xs text-gray-600">
                          {String(log.details)}
                        </span>
                      );
                    }
                  })()}
                </td>
              </tr>
            ))
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
  );
}
