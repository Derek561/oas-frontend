import Link from 'next/link'

export default function Sidebar({ onLogout }) {
  return (
    <div className="flex flex-col justify-between h-screen w-56 bg-slate-800 text-white">
      <nav className="p-4 space-y-3">
        <h2 className="text-xl font-semibold mb-4">OHS Dashboard</h2>
        <Link href="/dashboard" className="block hover:text-blue-300">Home</Link>
        <Link href="/dashboard/clients" className="block hover:text-blue-300">Clients</Link>
        <Link href="/dashboard/census" className="block hover:text-blue-300">Census</Link>
        <Link href="/dashboard/reports" className="block hover:text-blue-300">Reports</Link>
      </nav>

      <div className="p-4">
        <button
          onClick={onLogout}
          className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-2 rounded transition-all duration-150"
        >
          Logout
        </button>
      </div>
    </div>
  )
}
