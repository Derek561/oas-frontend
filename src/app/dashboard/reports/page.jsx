export const dynamic = "force-dynamic";

"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabaseClient";

export default function ReportsPage() {
  const supabase = createClient();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const { data, error } = await supabase
          .from("reports")
          .select("*")
          .order("created_at", { ascending: false });
        if (error) throw error;
        setReports(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, [supabase]);

  if (loading) return <p className="p-6">Loading reports...</p>;
  if (error)
    return <p className="p-6 text-red-600 font-semibold">Error: {error}</p>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Reports</h1>
      <p className="text-gray-700 mb-4">
        This is the Reports page. Analytical data will appear here soon.
      </p>

      {reports.length === 0 ? (
        <p>No reports available.</p>
      ) : (
        <ul className="space-y-3">
          {reports.map((report) => (
            <li
              key={report.id}
              className="p-4 border rounded-lg shadow-sm bg-white hover:bg-gray-50"
            >
              <p className="font-semibold">{report.title || "Untitled Report"}</p>
              <p className="text-sm text-gray-600">
                {report.description || "No description provided."}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Created:{" "}
                {new Date(report.created_at).toLocaleString("en-US", {
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
