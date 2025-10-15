'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function MaintenancePage() {
  const [maintenance, setMaintenance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    house_id: '',
    submitted_by: '',
    issue: '',
  });
  const [error, setError] = useState(null);

  // Fetch existing maintenance records
  useEffect(() => {
    fetchMaintenance();
  }, []);

  // Fetch data from Supabase
  async function fetchMaintenance() {
    setLoading(true);
    const { data, error } = await supabase
      .from('maintenance')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching maintenance records:', error.message);
      setError(error.message);
    } else {
      setMaintenance(data || []);
    }
    setLoading(false);
  }

  // Handle form submission for adding a new record
  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.from('maintenance').insert([form]);
    if (error) {
      console.error('Error inserting record:', error.message);
      setError(error.message);
    } else {
      setForm({ house_id: '', submitted_by: '', issue: '' });
      fetchMaintenance();
    }

    setLoading(false);
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Maintenance Records</h1>

      {/* Form Section */}
      <form onSubmit={handleSubmit} className="mb-6 space-y-3">
        <input
          type="text"
          placeholder="House ID"
          value={form.house_id}
          onChange={(e) => setForm({ ...form, house_id: e.target.value })}
          className="border p-2 w-full rounded"
          required
        />
        <input
          type="text"
          placeholder="Submitted by"
          value={form.submitted_by}
          onChange={(e) => setForm({ ...form, submitted_by: e.target.value })}
          className="border p-2 w-full rounded"
          required
        />
        <textarea
          placeholder="Issue description"
          value={form.issue}
          onChange={(e) => setForm({ ...form, issue: e.target.value })}
          className="border p-2 w-full rounded"
          required
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          {loading ? 'Submitting...' : 'Add Record'}
        </button>
      </form>

      {/* Error Message */}
      {error && (
        <div className="text-red-600 mb-4">
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Records List */}
      <div>
        <h2 className="text-xl font-semibold mb-3">Existing Records</h2>
        {loading ? (
          <p>Loading maintenance records...</p>
        ) : maintenance.length > 0 ? (
          <ul className="space-y-2">
            {maintenance.map((item) => (
              <li
                key={item.id}
                className="border p-3 rounded bg-gray-50 shadow-sm"
              >
                <p>
                  <strong>House:</strong> {item.house_id}
                </p>
                <p>
                  <strong>Submitted by:</strong> {item.submitted_by}
                </p>
                <p>
                  <strong>Issue:</strong> {item.issue}
                </p>
                <p className="text-sm text-gray-500">
                  {new Date(item.created_at).toLocaleString()}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <p>No maintenance records found.</p>
        )}
      </div>
    </div>
  );
}
