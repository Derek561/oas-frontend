'use client';
export const dynamic = 'force-dynamic';  // 👈 add this line here

import React from "react";

export default function ClientsPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Clients</h1>
      <p>This is the Reports page. Analytical data will appear here soon.</p>
    </div>
  );
}
