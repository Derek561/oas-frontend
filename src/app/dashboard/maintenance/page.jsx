'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function MaintenancePage() {
  const [maintenance, setMaintenance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({ house_id: '', submitted_by: '', issue: '' });
  const [submitting, setSubmitting] = useState(false);

  // Fetch existing records
  useEffect(() => {
    fetchMaintenance();
  }, []);

  async function fetchMaintenance() {
    setLoading(true);
    const { data, error } = await supabase
      .from('maintenance')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) setError(error.message);
    else setMaintenance(data);
    setLoading(false);
  }

  // Handle form submission
  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);

    const { error } = await supabase.from('maintenance').insert([form]);

    if (error) alert('Error submitting request: ' + error.message);
    else {
      setForm({ house_id: '', submitted_by: '', issue: '' });
      await fetchMaintenance();
    }

    setSubmitting(false);
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold mb-4">Maintenance Requests</h1>

      {/* --- Form Section --- */}
      <form
        onSubmit={handleSubmit}
        className="bg-gray-100 p-4 rounded-md shadow-md max-w-lg space-y-3"
      >
        <div>
          <label className="block text-sm font-semibold mb-1">House ID</label>
          <input
            type="text"
            className="border p-2 w-full rounded"
            value={form.house_id}
            onChange={(e) => setForm({ ...form, house_id: e.target.value })}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-semibold mb-1">Submitted By</label>
          <input
            type="text"
            className="border p-2 w-full rounded"
            value={form.submitted_by}
            onChange={(e) => setForm({ ...form, submitted_by: e.target.value })}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-semibold mb-1">Issue</label>
          <textarea
            className="border p-2 w-full rounded"
            rows="3"
            value={form.issue}
            onChange={(e) => setForm({ ...form, issue: e.target.value })}
            required
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          {submitting ? 'Submitting...' : 'Submit Request'}
        </button>
      </form>

      {/* --- Table Section --- */}
      {loading ? (
        <p>Loading maintenance logs...</p>
      ) : maintenance.length === 0 ? (
        <p>No maintenance records found.</p>
      ) : (
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-200 text-left">
              <th className="p-2">House ID</th>
              <th className="p-2">Submitted By</th>
              <th className="p-2">Issue</th>
              <th className="p-2">Status</th>
              <th className="p-2">Created</th>
            </tr>
          </thead>
          <tbody>
            {maintenance.map((item) => (
              <tr key={item.id} className="border-b hover:bg-gray-50">
                <td className="p-2">{item.house_id}</td>
                <td className="p-2">{item.submitted_by}</td>
                <td className="p-2">{item.issue}</td>
                <td className="p-2">
                  <span
                    className={`px-2 py-1 rounded text-white text-sm ${
                      item.status === 'resolved'
                        ? 'bg-green-600'
                        : item.status === 'in_progress'
                        ? 'bg-yellow-500'
                        : 'bg-red-500'
                    }`}
                  >
                    {item.status || 'open'}
                  </span>
                </td>
                <td className="p-2">
                  {new Date(item.created_at).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
