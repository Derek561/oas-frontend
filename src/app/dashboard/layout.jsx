'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { getActiveStaff } from '@/lib/getActiveStaff'
import { logoutStaff } from '@/lib/logoutStaff'

export default function DashboardLayout({ children }) {
  const router = useRouter()
  const [staff, setStaff] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Validate local session and redirect if missing
    const activeStaff = getActiveStaff()
    if (!activeStaff) {
      console.warn('No active session found. Redirecting to login...')
      router.push('/login')
      return
    }
    setStaff(activeStaff)
    setLoading(false)
  }, [router])

  // Unified logout handler
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

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top Navigation */}
      <header className="flex justify-between items-center bg-white shadow p-4">
        <h1 className="text-lg font-semibold text-gray-800">
          Oceanside Housing Dashboard
        </h1>
        <div className="flex items-center space-x-3">
          <span className="text-gray-700 text-sm">
            {staff.name || 'Staff'} ({staff.role || 'User'})
          </span>
          <button
            onClick={handleLogout}
            className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-md text-sm"
          >
            Logout
          </button>
        </div>
      </header>

      {/* 👇 ADD THIS NEW NAVIGATION BAR BELOW THE HEADER 👇 */}
      <nav className="flex flex-wrap gap-4 text-sm font-medium text-gray-700 bg-gray-100 px-6 py-3 shadow-inner">
        <Link href="/dashboard/residents" className="hover:text-blue-600">
          Residents
        </Link>
        <Link href="/dashboard/maintenance" className="hover:text-blue-600">
          Maintenance
        </Link>
        <Link href="/dashboard/turnover" className="hover:text-blue-600">
          Shift Turnover
        </Link>
        <Link href="/dashboard/observation" className="hover:text-blue-600">
          Observation Notes
        </Link>
        <Link href="/dashboard/census" className="hover:text-blue-600">
          Census
        </Link>
        <Link href="/dashboard/audit" className="hover:text-blue-600">
          Audit
        </Link>
      </nav>
      {/* 👆 END NAVIGATION BAR 👆 */}

      {/* Page Body */}
      <main className="flex-1 p-6">{children}</main>
    </div>
  )
}
