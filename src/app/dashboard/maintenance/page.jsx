// src/app/dashboard/maintenance/page.jsx
// ───────────────────────────────────────────────
// Maintenance task placeholder
// ───────────────────────────────────────────────

"use client";

import React from "react";
import { createClient } from "@/lib/supabaseClient";

export default function MaintenancePage() {
  const supabase = createClient();

  return (
    <section className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Maintenance</h1>
      <p className="text-gray-700 mb-6">
        This page will display maintenance tickets, logs, and updates.
      </p>

      <div className="rounded-lg bg-white shadow-md p-4 border border-gray-200">
        <p className="text-gray-600">
          Maintenance module initialized — connected to Supabase backend.
        </p>
      </div>
    </section>
  );
}
