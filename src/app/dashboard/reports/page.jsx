"use client";
export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabaseClient";
import React from "react";

export default function ReportsPage() {
  const supabase = createClient();

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Reports</h1>
      <p className="text-gray-700">
        This is the Reports page. Data will be displayed here.
      </p>
    </div>
  );
}
