'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabaseClient'

export default function ProtectedRoute({ children, allowedRoles = ['user', 'admin'] }) {
  const [loading, setLoading] = useState(true)
  const [authorized, setAuthorized] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const verifySession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/login')
        return
      }

      const { data, error } = await supabase
        .from('accounts')
        .select('role')
        .eq('user_id', session.user.id)
        .single()

      if (error || !data || !allowedRoles.includes(data.role)) {
        router.push('/login')
        return
      }

      setAuthorized(true)
      setLoading(false)
    }

    verifySession()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen text-gray-600">
        <span className="animate-pulse">Verifying access…</span>
      </div>
    )
  }

  if (!authorized) return null
  return children
}
