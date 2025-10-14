'use client'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { supabase } from './utils/supabaseClient'
import LoadingSpinner from '../components/LoadingSpinner'

export default function Home() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession()
      if (data.session) {
        router.replace('/dashboard')
      } else {
        router.replace('/login')
      }
      setLoading(false)
    }
    checkSession()
  }, [router])

  if (loading) {
    return <LoadingSpinner message="Hold On Here Comes the BOOM..." />
  }

  return null
}
