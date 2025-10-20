'use client'

import { useEffect } from 'react'
import { logoutStaff } from '@/lib/logoutStaff'

export default function LogoutPage() {
  useEffect(() => {
    logoutStaff()
  }, [])

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center">
        <h1 className="text-xl font-semibold mb-4">Logging you out...</h1>
        <p className="text-gray-600">Please wait a moment.</p>
      </div>
    </div>
  )
}
