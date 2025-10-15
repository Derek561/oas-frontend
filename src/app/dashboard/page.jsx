// src/app/dashboard/page.jsx
// ───────────────────────────────────────────────
// Root dashboard landing page
// ───────────────────────────────────────────────

"use client";

import React from "react";

export default function DashboardPage() {
  return (
    <section className="p-6">
      <h1 className="text-3xl font-bold mb-4">Dashboard Overview</h1>
      <p className="text-gray-700 leading-relaxed">
        Welcome to the OAS Dashboard. Use the sidebar to navigate through
        <strong> Clients</strong>, <strong>Reports</strong>, and
        <strong> Maintenance</strong> modules.
      </p>
    </section>
  );
}
