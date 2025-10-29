import Link from 'next/link'

export default function DashboardPage() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
  {/* Residents */}
  <Link
    href="/dashboard/residents"
    className="p-6 bg-blue-100 rounded-xl hover:bg-blue-200 transition"
  >
    <h2 className="text-xl font-semibold mb-1">Residents</h2>
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

  {/* Shift Turnover */}
  <Link
    href="/dashboard/turnover"
    className="p-6 bg-green-100 rounded-xl hover:bg-green-200 transition"
  >
    <h2 className="text-xl font-semibold mb-1">Shift Turnover</h2>
    <p className="text-gray-600">Record daily shift logs and updates</p>
  </Link>

  {/* Observation Notes */}
  <Link
    href="/dashboard/observation"
    className="p-6 bg-indigo-100 rounded-xl hover:bg-indigo-200 transition"
  >
    <h2 className="text-xl font-semibold mb-1">Observation Notes</h2>
    <p className="text-gray-600">Document resident behaviors and incidents</p>
  </Link>

  {/* Census */}
  <Link
    href="/dashboard/census"
    className="p-6 bg-purple-100 rounded-xl hover:bg-purple-200 transition"
  >
    <h2 className="text-xl font-semibold mb-1">Census</h2>
    <p className="text-gray-600">Track occupancy and counts</p>
  </Link>

  {/* Audit */}
  <Link
    href="/dashboard/audit"
    className="p-6 bg-white rounded-xl shadow hover:shadow-md transition"
  >
    <h2 className="text-xl font-semibold mb-1 text-gray-900">Audit</h2>
    <p className="text-gray-600">Review all system activity in real time</p>
  </Link>
</div>
  )
}
