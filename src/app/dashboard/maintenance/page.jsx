"use client";
export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabaseClient";
import React from "react";

export default function MaintenancePage() {
  const supabase = createClient();

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Maintenance</h1>
      <p className="text-gray-700">
        This is the Maintenance page. Maintenance requests will appear here.
      </p>
    </div>
  );
}
