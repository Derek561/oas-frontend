"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabaseClient";

export default function ClientsPage() {
  const supabase = createClient();
  const [clients, setClients] = useState([]);

  useEffect(() => {
    async function fetchClients() {
      const { data, error } = await supabase.from("residents").select("*").order("created_at", { ascending: false });
      if (!error) setClients(data || []);
    }
    fetchClients();
  }, [supabase]);

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Clients</h2>
      {clients.length === 0 ? (
        <p className="text-gray-500">No residents found.</p>
      ) : (
        <ul className="divide-y divide-gray-200">
          {clients.map((c) => (
            <li key={c.id} className="py-2">
              <strong>{c.first_name} {c.last_name}</strong> — {c.status}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
