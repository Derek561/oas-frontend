export const dynamic = "force-dynamic";

"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabaseClient";

export default function MaintenancePage() {
  const supabase = createClient();
  const [maintenance, setMaintenance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchMaintenance = async () => {
      try {
        const { data, error } = await supabase
          .from("maintenance")
          .select("*")
          .order("created_at", { ascending: false });
        if (error) throw error;
        setMaintenance(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchMaintenance();
  }, [supabase]);

  if (loading) return <p className="p-6">Loading maintenance records...</p>;
  if (error)
    return <p className="p-6 text-red-600 font-semibold">Error: {error}</p>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Maintenance Requests</h1>
      {maintenance.length === 0 ? (
        <p>No maintenance records found.</p>
      ) : (
        <ul className="space-y-3">
          {maintenance.map((item) => (
            <li
              key={item.id}
              className="p-4 border rounded-lg shadow-sm bg-white hover:bg-gray-50"
            >
              <p>
                <strong>House:</strong> {item.house_id}
              </p>
              <p>
                <strong>Issue:</strong> {item.issue || "N/A"}
              </p>
              <p className="text-sm text-gray-500">
                Submitted:{" "}
                {new Date(item.created_at).toLocaleString("en-US", {
                  dateStyle: "short",
                  timeStyle: "short",
                })}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
