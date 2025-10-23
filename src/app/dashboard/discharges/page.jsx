"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function DischargesPage() {
  const [client_id, setClientId] = useState("");
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const [discharges, setDischarges] = useState([]);

  // 🔹 Load list
  const fetchDischarges = async () => {
    const { data, error } = await supabase
      .from("discharges")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error) setDischarges(data || []);
  };

  useEffect(() => {
    fetchDischarges();
  }, []);

  // 🔹 Insert
  const handleAddDischarge = async (e) => {
    e.preventDefault();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return alert("Login required.");

    const { error } = await supabase
      .from("discharges")
      .insert([{ client_id, reason, notes }])
      .select();

    if (error) {
      console.error(error);
      alert("Error saving discharge");
    } else {
      alert("✅ Discharge saved");
      setClientId("");
      setReason("");
      setNotes("");
      fetchDischarges();
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-4">Client Discharges</h2>

      <form onSubmit={handleAddDischarge} className="space-y-2 mb-6">
        <input
          className="border p-2 w-full rounded"
          placeholder="Client ID"
          value={client_id}
          onChange={(e) => setClientId(e.target.value)}
        />
        <input
          className="border p-2 w-full rounded"
          placeholder="Reason for Discharge"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
        <textarea
          className="border p-2 w-full rounded"
          placeholder="Notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Add Discharge
        </button>
      </form>

      <table className="w-full border border-gray-200 text-left">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-2 border-b">Date</th>
            <th className="p-2 border-b">Client ID</th>
            <th className="p-2 border-b">Reason</th>
            <th className="p-2 border-b">Notes</th>
          </tr>
        </thead>
        <tbody>
          {discharges.map((d) => (
            <tr key={d.id}>
              <td className="p-2 border-b">
                {new Date(d.created_at).toLocaleString()}
              </td>
              <td className="p-2 border-b">{d.client_id}</td>
              <td className="p-2 border-b">{d.reason}</td>
              <td className="p-2 border-b">{d.notes}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
