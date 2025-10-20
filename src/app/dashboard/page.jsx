import Link from 'next/link'

export default function DashboardPage() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {/* Clients */}
      <Link
        href="/dashboard/clients"
        className="p-6 bg-blue-100 rounded-xl hover:bg-blue-200 transition"
      >
        <h2 className="text-xl font-semibold mb-1">Clients</h2>
        <p className="text-gray-600">Manage residents and admissions</p>
      </Link>

      {/* Maintenance */}
      <Link
        href="/dashboard/maintenance"
        className="p-6 bg-yellow-100 rounded-xl hover:bg-yellow-200 transition"
      >
        <h2 className="text-xl font-semibold mb-1">Maintenance</h2>
        <p className="text-gray-600">Track maintenance requests</p>
      </Link>

      {/* Reports */}
      <Link
        href="/dashboard/reports"
        className="p-6 bg-green-100 rounded-xl hover:bg-green-200 transition"
      >
        <h2 className="text-xl font-semibold mb-1">Reports</h2>
        <p className="text-gray-600">View and submit staff reports</p>
      </Link>

      {/* Census */}
      <Link
        href="/dashboard/census"
        className="p-6 bg-purple-100 rounded-xl hover:bg-purple-200 transition"
      >
        <h2 className="text-xl font-semibold mb-1">Census</h2>
        <p className="text-gray-600">Track occupancy and counts</p>
      </Link>

      {/* Client Discharges */}
      <Link
        href="/dashboard/discharges"
        className="p-6 bg-white rounded-xl shadow hover:shadow-md transition"
      >
        <h2 className="text-xl font-semibold mb-1 text-gray-900">
          Client Discharges
        </h2>
        <p className="text-gray-600">
          View and record client discharges with automatic audit logs.
        </p>
      </Link>

      {/* Audit Trail */}
      <Link
        href="/dashboard/audit"
        className="p-6 bg-white rounded-xl shadow hover:shadow-md transition"
      >
        <h2 className="text-xl font-semibold mb-1 text-gray-900">Audit Trail</h2>
        <p className="text-gray-600">
          Track all system activity and staff actions in real time.
        </p>
      </Link>
    </div>
  )
}
