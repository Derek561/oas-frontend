'use client'

import { useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { saveStaffSession } from '@/lib/getActiveStaff'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [pin, setPin] = useState('')
  const [mode, setMode] = useState('pin')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleAdminLogin(e) {
    e.preventDefault()
    setLoading(true)
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) return setError(error.message)
    window.location.href = '/dashboard'
  }

  async function handleStaffLogin(e) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { data, error } = await supabase
      .from('staff')
      .select('id')
      .eq('pin_code', pin)
      .single()

    if (error || !data) {
      setLoading(false)
      return setError('Invalid PIN')
    }

    const { data: session, error: sessionError } = await supabase
      .from('staff_sessions')
      .insert({ staff_id: data.id })
      .select('id')
      .single()

    if (sessionError) {
      setLoading(false)
      return setError('Could not start session')
    }

    saveStaffSession(session.id)
    window.location.href = '/dashboard'
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <div className="bg-white shadow-lg rounded-xl p-8 w-full max-w-sm">
        <h1 className="text-2xl font-semibold mb-4 text-center text-gray-800">
          Oceanside Housing Login
        </h1>

        <div className="flex justify-center mb-6">
          <button
            className={`px-4 py-2 rounded-l ${mode === 'pin' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
            onClick={() => setMode('pin')}
          >
            Staff (PIN)
          </button>
          <button
            className={`px-4 py-2 rounded-r ${mode === 'admin' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
            onClick={() => setMode('admin')}
          >
            Admin
          </button>
        </div>

        {mode === 'admin' ? (
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
        ) : (
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
        )}

        {error && <p className="text-red-500 text-center mt-4">{error}</p>}
      </div>
    </div>
  )
}
