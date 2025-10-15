"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabaseClient";

export default function MaintenancePage() {
  const [maintenance, setMaintenance] = useState([]);

  useEffect(() => {
    const supabase = createClient();
    async function loadData() {
      const { data, error } = await supabase.from("maintenance").select("*");
      if (!error && data) setMaintenance(data);
    }
    loadData();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Maintenance</h1>
      <ul className="space-y-4">
        {maintenance.map((item) => (
          <li key={item.id} className="p-4 border rounded-lg bg-white shadow-sm">
            <strong>{item.issue}</strong>
            <p className="text-sm text-gray-600">
              Submitted:{" "}
              {new Date(item.created_at).toLocaleString("en-US", {
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
