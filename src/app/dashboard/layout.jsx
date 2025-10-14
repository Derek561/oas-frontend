'use client'
import { useRouter } from 'next/navigation'
import { supabase } from '../utils/supabaseClient'
import Sidebar from '../../components/Sidebar'
import { useEffect } from 'react'

export default function DashboardLayout({ children }) {
  const router = useRouter()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    localStorage.removeItem('ohs-session')
    router.push('/login')
  }

  // Optional: redirect if no active session
  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession()
      if (!data.session) router.replace('/login')
    }
    checkSession()
  }, [router])

  return (
    <div className="flex min-h-screen">
      <Sidebar onLogout={handleLogout} />
      <main className="flex-1 p-6 bg-gray-100">
        {children}
      </main>
    </div>
  )
}
