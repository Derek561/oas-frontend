"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"
import LoadingOverlay from "@/components/LoadingOverlay"
import LogoutButton from "@/components/LogoutButton"

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data, error } = await supabase.auth.getUser()
        if (error) throw error
        if (!data.user) {
          router.replace("/login") // Redirect if not logged in
        } else {
          setUser(data.user)
        }
      } catch (err) {
        console.error("Auth check failed:", err.message)
        router.replace("/login")
      } finally {
        setLoading(false)
      }
    }

    fetchUser()
  }, [router])

  if (loading) {
    return <LoadingOverlay text="Hold on — verifying your session..." />
  }

  if (!user) return null // avoid flash before redirect

  return (
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
          <p>Drill down into rooms, capacity, and availability.</p>
        </div>
        <div className="bg-white shadow rounded p-4">
          <h2 className="text-lg font-bold">Enrollment Roster</h2>
          <p>See which clients are admitted and their status.</p>
        </div>
      </div>

      <LogoutButton />
    </div>
  )
}
