'use client'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabaseClient'
import { useState } from 'react'

export default function LogoutButton() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)

  const handleLogout = async () => {
    setLoading(true)
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <button
      onClick={handleLogout}
      disabled={loading}
      className={`w-full bg-red-600 text-white rounded-md py-2 mt-4 
      hover:bg-red-700 transition-colors ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
    >
      {loading ? 'Signing out…' : 'Logout'}
    </button>
  )
}
