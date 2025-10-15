// src/app/dashboard/reports/page.jsx
// ───────────────────────────────────────────────
// Reports viewer placeholder
// ───────────────────────────────────────────────

"use client";

import React from "react";
import { createClient } from "@/lib/supabaseClient";

export default function ReportsPage() {
  const supabase = createClient();

  return (
    <section className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Reports</h1>
      <p className="text-gray-700 mb-6">
        This is the Reports page. Future versions will load analytics and
        visualizations directly from Supabase queries.
      </p>

      <div className="rounded-lg bg-white shadow-md p-4 border border-gray-200">
        <p className="text-gray-600">
          Report generation system is connected — awaiting dataset bindings.
        </p>
      </div>
    </section>
  );
}
