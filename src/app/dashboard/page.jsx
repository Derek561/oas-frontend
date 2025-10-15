export const dynamic = "force-dynamic";

"use client";
import React from "react";

export default function DashboardPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Welcome to the Dashboard</h1>
      <p>This is the main dashboard overview page.</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        <div className="p-4 border rounded-lg shadow-sm bg-white">
          <h2 className="font-semibold">House Census</h2>
          <p className="text-sm text-gray-600">
            View capacity and occupancy across all houses.
          </p>
        </div>
        <div className="p-4 border rounded-lg shadow-sm bg-white">
          <h2 className="font-semibold">Room Census</h2>
          <p className="text-sm text-gray-600">
            Drill down into room capacity and availability.
          </p>
        </div>
        <div className="p-4 border rounded-lg shadow-sm bg-white">
          <h2 className="font-semibold">Enrollment Roster</h2>
          <p className="text-sm text-gray-600">
            See which clients are admitted and their current placement.
          </p>
        </div>
      </div>
    </div>
  );
}
