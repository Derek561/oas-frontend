// src/app/dashboard/clients/page.jsx
// ───────────────────────────────────────────────
// Clients management placeholder
// ───────────────────────────────────────────────

"use client";

import React from "react";
import { createClient } from "@/lib/supabaseClient";

export default function ClientsPage() {
  const supabase = createClient();

  return (
    <section className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Clients</h1>
      <p className="text-gray-700 mb-6">
        This is the Clients module. Client data will appear here soon.
      </p>

      <div className="rounded-lg bg-white shadow-md p-4 border border-gray-200">
        <p className="text-gray-600">
          No client records loaded yet — connection verified with Supabase.
        </p>
      </div>
    </section>
  );
}
