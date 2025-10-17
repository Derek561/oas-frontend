"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabaseClient";

export default function CensusPage() {
  const supabase = createClient();
  const [records, setRecords] = useState([]);

  useEffect(() => {
    async function fetchCensus() {
      const { data, error } = await supabase.from("census").select("*").order("census_date", { ascending: false });
      if (!error) setRecords(data || []);
    }
    fetchCensus();
  }, [supabase]);

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Census Overview</h2>
      {records.length === 0 ? (
        <p className="text-gray-500">No census data available.</p>
      ) : (
        <table className="min-w-full bg-white border border-gray-200">
          <thead>
            <tr className="bg-gray-100 text-left">
              <th className="p-2 border-b">Date</th>
              <th className="p-2 border-b">Active Count</th>
            </tr>
          </thead>
          <tbody>
                    {records.map((r) => (
              <tr key={r.id}>
                <td className="p-2 border-b">{r.census_date}</td>
                <td className="p-2 border-b">{r.active_count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
