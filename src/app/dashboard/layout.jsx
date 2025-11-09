'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { getActiveStaff } from '@/lib/getActiveStaff'
import { logoutStaff } from '@/lib/logoutStaff'

export default function DashboardLayout({ children }) {
  const router = useRouter()
  const pathname = usePathname()
  const [staff, setStaff] = useState(null)
  const [loading, setLoading] = useState(true)

  // Session validation
  useEffect(() => {
    const activeStaff = getActiveStaff()
    if (!activeStaff) {
      console.warn('⚠️ No active session found. Redirecting to login...')
      router.push('/login')
      return
    }
    setStaff(activeStaff)
    setLoading(false)
  }, [router])

  async function handleLogout() {
    try {
      await logoutStaff()
      router.push('/login')
    } catch (error) {
      console.error('Logout failed:', error)
      router.push('/login')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen text-gray-600">
        Loading dashboard...
      </div>
    )
  }

  if (!staff) {
    return (
      <div className="flex items-center justify-center min-h-screen text-gray-600 text-center">
        Session expired or not found.
        <div className="mt-4">
          <button
            onClick={() => router.push('/login')}
            className="bg-blue-600 text-white px-4 py-2 rounded-md"
          >
            Return to Login
          </button>
        </div>
      </div>
    )
  }

  const navItems = [
    { name: 'Home', href: '/dashboard' },
    { name: 'Residents', href: '/dashboard/residents' },
    { name: 'Maintenance', href: '/dashboard/maintenance' },
    { name: 'Shift Turnover', href: '/dashboard/turnover' },
    { name: 'Observation Notes', href: '/dashboard/observation' },
    { name: 'Census', href: '/dashboard/census' },
    { name: 'Audit', href: '/dashboard/audit' },
  ]

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top Header */}
      <header className="flex justify-between items-center bg-white shadow p-4">
        <h1 className="text-lg font-semibold text-gray-800">
          Oceanside Housing System
        </h1>
        <div className="flex items-center space-x-3">
          <span className="text-gray-700 text-sm">
            {staff?.name || 'Staff'} ({staff?.role || 'User'})
          </span>
          <button
            onClick={handleLogout}
            className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-md text-sm"
          >
            Logout
          </button>
        </div>
      </header>

      {/* Navigation Bar */}
      <nav className="flex flex-wrap gap-4 text-sm font-medium text-gray-700 bg-gray-100 px-6 py-3 shadow-inner">
        {navItems.map((item) => (
          <Link
            key={item.name}
            href={item.href}
            className={`transition-colors ${
              pathname === item.href
                ? 'text-blue-700 font-semibold underline underline-offset-4'
                : 'hover:text-blue-600'
            }`}
          >
            {item.name}
          </Link>
        ))}
      </nav>

      {/* Page Body */}
      <main className="flex-1 p-6">{children}</main>

      {/* Footer (Optional, can be removed or restyled later) */}
      <footer className="bg-white border-t text-sm text-gray-500 text-center py-3">
        © {new Date().getFullYear()} Oceanside Housing LLC — Internal Staff Portal
      </footer>
    </div>
  )
}
