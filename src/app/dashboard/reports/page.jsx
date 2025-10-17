"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabaseClient";

export default function ReportsPage() {
  const supabase = createClient();
  const [reports, setReports] = useState([]);

  useEffect(() => {
    async function fetchReports() {
      const { data, error } = await supabase.from("shift_logs").select("*").order("created_at", { ascending: false });
      if (!error) setReports(data || []);
    }
    fetchReports();
  }, [supabase]);

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Shift Reports</h2>
      {reports.length === 0 ? (
        <p className="text-gray-500">No reports logged yet.</p>
      ) : (
        <ul className="divide-y divide-gray-200">
          {reports.map((r) => (
            <li key={r.id} className="py-2">
              <strong>{r.resident_id}</strong> — {r.behavior_notes || "No notes"}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
