'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getActiveStaff } from '@/lib/getActiveStaff'
import { logoutStaff } from '@/lib/logoutStaff'

export default function DashboardLayout({ children }) {
  const router = useRouter()
  const [staff, setStaff] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function checkSession() {
      try {
        const activeStaff = await getActiveStaff()
        if (!activeStaff) {
          console.warn('No active session found. Redirecting to login...')
          router.push('/login')
          return
        }
        setStaff(activeStaff)
      } catch (err) {
        console.error('Error checking session:', err)
        router.push('/login')
      } finally {
        setLoading(false)
      }
    }

    checkSession()
  }, [router])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen text-gray-600">
        Loading dashboard...
      </div>
    )
  }

  if (!staff) {
    return (
      <div className="flex items-center justify-center min-h-screen text-gray-600">
        Session expired or not found. <br />
        <button
          onClick={() => router.push('/login')}
          className="mt-2 bg-blue-600 text-white px-4 py-2 rounded-md"
        >
          Return to Login
        </button>
      </div>
    )
  }

  // Unified logout for both Supabase Auth and PIN
  async function handleLogout() {
    if (staff.session_type === 'supabase') {
      await logoutStaff('supabase')
    } else {
      await logoutStaff('pin')
    }
    router.push('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="flex justify-between items-center bg-white shadow p-4">
        <h1 className="text-lg font-semibold text-gray-800">
          Oceanside Housing Dashboard
        </h1>
        <div className="flex items-center space-x-3">
          <span className="text-gray-700 text-sm">
            {staff.name} ({staff.role})
          </span>
          <button
            onClick={handleLogout}
            className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-md text-sm"
          >
            Logout
          </button>
        </div>
      </header>

      <main className="flex-1 p-6">{children}</main>
    </div>
  )
}
