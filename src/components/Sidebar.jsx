'use client'
import Link from 'next/link'
import LogoutButton from '@/components/LogoutButton'

export default function Sidebar() {
  return (
    <aside className="w-64 h-screen bg-slate-900 text-white flex flex-col justify-between">
      <div>
        <div className="text-lg font-bold p-4 border-b border-slate-700">OHS Dashboard</div>
        <nav className="flex flex-col p-4 space-y-2">
          <Link href="/dashboard" className="hover:bg-slate-800 rounded-md px-3 py-2">Home</Link>
          <Link href="/clients" className="hover:bg-slate-800 rounded-md px-3 py-2">Clients</Link>
          <Link href="/census" className="hover:bg-slate-800 rounded-md px-3 py-2">Census</Link>
          <Link href="/reports" className="hover:bg-slate-800 rounded-md px-3 py-2">Reports</Link>
        </nav>
      </div>
      <div className="p-4 border-t border-slate-700">
        <LogoutButton />
      </div>
    </aside>
  )
}
