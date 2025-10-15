"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabaseClient";

export default function ReportsPage() {
  const [reports, setReports] = useState([]);

  useEffect(() => {
    const supabase = createClient();
    async function loadReports() {
      const { data, error } = await supabase.from("reports").select("*");
      if (!error && data) setReports(data);
    }
    loadReports();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Reports</h1>
      <ul className="space-y-4">
        {reports.map((report) => (
          <li key={report.id} className="p-4 border rounded-lg bg-white shadow-sm">
            <p className="font-semibold">{report.title || "Untitled Report"}</p>
            <p className="text-gray-600 text-sm">{report.description}</p>
            <p className="text-sm text-gray-500">
              Created:{" "}
              {new Date(report.created_at).toLocaleString("en-US", {
                dateStyle: "short",
                timeStyle: "short",
              })}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
