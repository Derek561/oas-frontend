'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function ReportsPage() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch reports data on load
  useEffect(() => {
    fetchReports();
  }, []);

  async function fetchReports() {
    setLoading(true);
    const { data, error } = await supabase
      .from('reports')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching reports:', error.message);
      setError(error.message);
    } else {
      setReports(data || []);
    }
    setLoading(false);
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Reports Dashboard</h1>
      <p className="mb-6 text-gray-700">
        Analytical data and system reports will appear here.
      </p>

      {/* Error Message */}
      {error && (
        <div className="text-red-600 mb-4">
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Reports Section */}
      <div>
        <h2 className="text-xl font-semibold mb-3">Recent Reports</h2>
        {loading ? (
          <p>Loading reports...</p>
        ) : reports.length > 0 ? (
          <ul className="space-y-3">
            {reports.map((report) => (
              <li
                key={report.id}
                className="border p-3 rounded bg-gray-50 shadow-sm"
              >
                <p>
                  <strong>Title:</strong> {report.title || 'Untitled Report'}
                </p>
                <p>
                  <strong>Description:</strong> {report.description || 'N/A'}
                </p>
                <p className="text-sm text-gray-500">
                  Created: {new Date(report.created_at).toLocaleString()}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <p>No reports available.</p>
        )}
      </div>
    </div>
  );
}
