'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabaseClient'
import ProtectedRoute from '@/components/ProtectedRoute'
import LoadingSpinner from '@/components/LoadingSpinner'

export default function DashboardPage() {
  const [user, setUser] = useState(null)
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const { data, error } = await supabase.auth.getUser()
      if (error) return console.error(error)
      setUser(data?.user)
    }
    getUser()
  }, [])

  if (!user) return <LoadingSpinner />

  return (
    <ProtectedRoute allowedRoles={['user', 'admin']}>
      <div className="p-6">
        <h1 className="text-2xl font-semibold mb-4">
          Welcome back, {user.email}
        </h1>
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white shadow rounded p-4">
            <h2 className="text-lg font-bold">House Census</h2>
            <p>View capacity and occupancy across all houses.</p>
          </div>
          <div className="bg-white shadow rounded p-4">
            <h2 className="text-lg font-bold">Room Census</h2>
            <p>Drill down into individual rooms, capacity, and availability.</p>
          </div>
          <div className="bg-white shadow rounded p-4">
            <h2 className="text-lg font-bold">Enrollment Roster</h2>
            <p>See which clients are admitted, where they’re placed, and their status.</p>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}
