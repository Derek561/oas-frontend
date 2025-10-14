'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../utils/supabaseClient'
import LoadingSpinner from '../../components/LoadingSpinner'

export default function Logout() {
  const router = useRouter()

  useEffect(() => {
    const logout = async () => {
      await supabase.auth.signOut()
      localStorage.removeItem('ohs-session')
      router.replace('/login')
    }
    logout()
  }, [router])

  return <LoadingSpinner message="Dueces Yo..." />
}
