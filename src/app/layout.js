'use client'

import './globals.css'
import { useEffect } from 'react'
import { supabase } from './utils/supabaseClient'

export default function RootLayout({ children }) {
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        localStorage.setItem('ohs-session', JSON.stringify(session))
      } else {
        localStorage.removeItem('ohs-session')
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
