"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabaseClient";

export default function MaintenancePage() {
  const supabase = createClient();
  const [tickets, setTickets] = useState([]);

  useEffect(() => {
    async function fetchTickets() {
      const { data, error } = await supabase.from("maintenance").select("*").order("created_at", { ascending: false });
      if (!error) setTickets(data || []);
    }
    fetchTickets();
  }, [supabase]);

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Maintenance Requests</h2>
      {tickets.length === 0 ? (
        <p className="text-gray-500">No open maintenance requests.</p>
      ) : (
        <ul className="divide-y divide-gray-200">
          {tickets.map((t) => (
            <li key={t.id} className="py-2">
              <strong>{t.issue}</strong> — {t.status} ({t.priority})
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
