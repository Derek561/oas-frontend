"use client";
import Link from "next/link";

export default function DashboardPage() {
  return (
    <div className="grid grid-cols-2 gap-6">
      <Link href="/dashboard/clients" className="p-6 bg-blue-100 rounded-xl hover:bg-blue-200 transition">
        <h2 className="text-xl font-semibold mb-1">Clients</h2>
        <p className="text-gray-600">Manage residents and admissions</p>
      </Link>

      <Link href="/dashboard/maintenance" className="p-6 bg-yellow-100 rounded-xl hover:bg-yellow-200 transition">
        <h2 className="text-xl font-semibold mb-1">Maintenance</h2>
        <p className="text-gray-600">Track maintenance requests</p>
      </Link>

      <Link href="/dashboard/reports" className="p-6 bg-green-100 rounded-xl hover:bg-green-200 transition">
        <h2 className="text-xl font-semibold mb-1">Reports</h2>
        <p className="text-gray-600">View and submit staff reports</p>
      </Link>

      <Link href="/dashboard/census" className="p-6 bg-purple-100 rounded-xl hover:bg-purple-200 transition">
        <h2 className="text-xl font-semibold mb-1">Census</h2>
        <p className="text-gray-600">Track occupancy and counts</p>
      </Link>
    </div>
  );
}
