"use client";

import { useEffect, useState } from "react";
import { supabase } from "./utils/supabaseClient";

export default function Home() {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    async function loadUsers() {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("❌ Error fetching users:", error.message);
      } else {
        console.log("✅ Fetched users:", data);
        setUsers(data || []);
      }
    }

    loadUsers();
  }, []);

  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-slate-900 text-white">
      <h1 className="text-2xl font-semibold mb-4">Connected to Supabase ✅</h1>

      {users.length > 0 ? (
        <>
          <p>Fetched {users.length} user(s) from your database:</p>
          <ul className="mt-4 space-y-1">
            {users.map((u) => (
              <li key={u.id || u.uuid} className="text-sm text-slate-300">
                {u.email} — {u.role || "N/A"}
              </li>
            ))}
          </ul>
        </>
      ) : (
        <p>No users found in your database.</p>
      )}
    </main>
  );
}
