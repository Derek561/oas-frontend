'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { getActiveStaff, saveStaffSession } from '@/lib/getActiveStaff'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [mode, setMode] = useState('pin') // 'pin' or 'admin'
  const [pin, setPin] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Auto-redirect if session already exists
  useEffect(() => {
    const staff = getActiveStaff()
    if (staff) router.push('/dashboard')
  }, [router])

  // 🔐 Admin Login
  async function handleAdminLogin(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    setLoading(false)
    if (error) return setError(error.message)

    // Save Admin session locally
    saveStaffSession({
      id: data.user?.id,
      name: data.user?.email || 'Admin',
      role: 'Admin',
    })

    router.push('/dashboard')
  }

  // 👷 Staff PIN Login
  async function handleStaffLogin(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    // Validate PIN against staff table
    const { data: staff, error } = await supabase
      .from('staff')
      .select('*')
      .eq('pin_code', pin)
      .single()

    setLoading(false)

    if (error || !staff) {
      console.warn('Invalid PIN:', error)
      return setError('Invalid PIN. Please try again.')
    }

    // Save Staff session locally
    saveStaffSession({
      id: staff.id,
      name: staff.name || staff.email || 'Staff',
      role: staff.role || 'Staff',
    })

    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <div className="bg-white shadow-lg rounded-xl p-8 w-full max-w-sm">
        <h1 className="text-2xl font-semibold mb-6 text-center text-gray-800">
          Oceanside Housing Login
        </h1>

        {/* Tabs */}
        <div className="flex justify-center mb-6">
          <button
            onClick={() => setMode('pin')}
            className={`px-4 py-2 rounded-l ${mode === 'pin'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700'
            }`}
          >
            Staff (PIN)
          </button>
          <button
            onClick={() => setMode('admin')}
            className={`px-4 py-2 rounded-r ${mode === 'admin'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700'
            }`}
          >
            Admin
          </button>
        </div>

        {/* PIN Login Form */}
        {mode === 'pin' ? (
          <form onSubmit={handleStaffLogin} className="space-y-4">
            <input
              type="password"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="Enter PIN"
              className="w-full border rounded p-2"
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
            >
              {loading ? 'Verifying...' : 'Login with PIN'}
            </button>
          </form>
        ) : (
          // Admin Email Login Form
          <form onSubmit={handleAdminLogin} className="space-y-4">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              className="w-full border rounded p-2"
              required
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full border rounded p-2"
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>
        )}

        {error && <p className="text-red-500 text-center mt-4">{error}</p>}
      </div>
    </div>
  )
}
