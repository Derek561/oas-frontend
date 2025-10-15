"use client";
export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabaseClient";
import React from "react";

export default function DashboardPage() {
  const supabase = createClient();

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Dashboard</h1>
      <p className="text-gray-700">Main dashboard view.</p>
    </div>
  );
}
