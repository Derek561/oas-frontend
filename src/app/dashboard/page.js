'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/utils/supabaseClient'

export default function Dashboard() {
  const router = useRouter()
  const [session, setSession] = useState(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (!session) router.push('/login')
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (!session) router.push('/login')
    })

    return () => listener.subscription.unsubscribe()
  }, [router])

  if (!session) return <p className="text-center mt-20">Loading...</p>

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
      <h1 className="text-3xl font-bold text-slate-800 mb-4">
        Welcome to your Dashboard
      </h1>
      <p className="text-slate-600">Signed in as {session.user.email}</p>
    </div>
  )
}
