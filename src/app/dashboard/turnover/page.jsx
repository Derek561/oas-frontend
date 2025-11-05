'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'

export default function ShiftTurnoverPage() {
  const [turnovers, setTurnovers] = useState([])
  const [houses, setHouses] = useState([])
  const [staffList, setStaffList] = useState([])
  const [handoverNotes, setHandoverNotes] = useState('')
  const [shiftName, setShiftName] = useState('')
  const [filterRange, setFilterRange] = useState('48h')
  const [userRole, setUserRole] = useState('')
  const [currentHouse, setCurrentHouse] = useState('')

  useEffect(() => {
    getUserContext()
    fetchHouses()
  }, [filterRange])

  // 🧩 Load current user and their assigned house
  async function getUserContext() {
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()
      if (userError || !user) return console.warn('⚠️ No authenticated user.')

      const { data: staff, error: staffError } = await supabase
        .from('staff')
        .select('id, role, name, email')
        .eq('email', user.email)
        .maybeSingle()

      if (staffError) console.warn('Staff fetch error:', staffError.message)

      if (!staff) {
        setUserRole('admin')
        fetchTurnovers(null, 'admin')
        return
      }

      setUserRole(staff.role)

      const { data: pin, error: pinError } = await supabase
        .from('staff_pins')
        .select('house_id, houses(name)')
        .eq('staff_id', staff.id)
        .maybeSingle()

      if (pinError) console.warn('Pin fetch error:', pinError.message)
      if (pin?.houses?.name) setCurrentHouse(pin.houses.name)

      fetchTurnovers(pin?.house_id || null, staff.role)
      fetchStaffList()
    } catch (err) {
      console.error('Error loading user context:', err.message)
    }
  }

  async function fetchHouses() {
    const { data, error } = await supabase.from('houses').select('id, name')
    if (!error) setHouses(data)
  }

  async function fetchStaffList() {
    const { data, error } = await supabase
      .from('staff')
      .select('id, name, role, email')
      .eq('active', true)
    if (!error) setStaffList(data)
  }

  // 🧩 Fetch turnover records (default 48 hours)
  async function fetchTurnovers(houseId = null, role = '') {
    try {
      const now = new Date()
      let since = new Date(now)

      if (filterRange === '24h') since.setHours(now.getHours() - 24)
      else if (filterRange === '48h') since.setHours(now.getHours() - 48)
      else if (filterRange === '7d') since.setDate(now.getDate() - 7)
      else since = new Date('2000-01-01')

      let query = supabase
        .from('shift_turnover')
        .select(`
          id,
          shift_name,
          handover_notes,
          created_at,
          house:house_id(name),
          submitter:submitted_by(name)
        `)
        .gte('created_at', since.toISOString())
        .order('created_at', { ascending: false })

      if (houseId && role !== 'admin') query = query.eq('house_id', houseId)

      const { data, error } = await query
      if (error) throw error
      setTurnovers(data || [])
    } catch (err) {
      console.error('Fetch turnover failed:', err.message)
    }
  }

  // 🧩 Add new turnover record
  async function handleAddTurnover(e) {
    e.preventDefault()
    if (!handoverNotes.trim() || !shiftName.trim())
      return alert('Please fill out both shift name and handover notes.')

    try {
      // Find current logged in staff ID
      const {
        data: { user },
      } = await supabase.auth.getUser()

      const { data: staff } = await supabase
        .from('staff')
        .select('id')
        .eq('email', user.email)
        .maybeSingle()

      const payload = {
        shift_name: shiftName,
        handover_notes: handoverNotes,
        submitted_by: staff?.id || null,
      }

      // Assign house only for non-admin staff
      if (currentHouse && houses.length > 0) {
        const matchedHouse = houses.find((h) => h.name === currentHouse)
        if (matchedHouse) payload.house_id = matchedHouse.id
      }

      const { error } = await supabase.from('shift_turnover').insert([payload])
      if (error) {
        console.error('Insert error:', error.message)
        return alert('⚠️ Error adding turnover entry.')
      }

      alert('✅ Turnover entry logged successfully.')
      setShiftName('')
      setHandoverNotes('')
      fetchTurnovers()
    } catch (err) {
      console.error('Add turnover failed:', err.message)
    }
  }

  async function handleDeleteTurnover(id) {
    if (userRole !== 'admin')
      return alert('❌ Only Admins can delete turnover entries.')

    if (!confirm('Are you sure you want to delete this turnover entry?')) return

    const { error } = await supabase.from('shift_turnover').delete().eq('id', id)
    if (error) return alert('⚠️ Error deleting turnover entry.')
    fetchTurnovers()
  }

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-2xl font-semibold">Shift Turnover Dashboard</h2>

      <p className="text-sm text-gray-600">
        Currently Viewing:{' '}
        <strong>{currentHouse || 'All Houses (Admin)'}</strong>
      </p>

      {/* --- Add New Turnover Form --- */}
      <Card className="p-4 shadow-sm">
        <form
          onSubmit={handleAddTurnover}
          className="grid md:grid-cols-4 gap-3 items-center"
        >
          <select
            value={shiftName}
            onChange={(e) => setShiftName(e.target.value)}
            className="border p-2 rounded"
            required
          >
            <option value="">Select Shift</option>
            <option value="8AM - 4PM">8AM - 4PM</option>
            <option value="4PM - 12AM">4PM - 12AM</option>
            <option value="12AM - 8AM">12AM - 8AM</option>
          </select>

          <input
            type="text"
            value={handoverNotes}
            onChange={(e) => setHandoverNotes(e.target.value)}
            placeholder="Handover Notes"
            className="border p-2 rounded col-span-2"
            required
          />

          <button
            type="submit"
            className="bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
          >
            Add Entry
          </button>
        </form>
      </Card>

      {/* --- Filters --- */}
      <div className="flex items-center space-x-3">
        <label className="text-sm font-medium text-gray-600">Filter:</label>
        <select
          value={filterRange}
          onChange={(e) => setFilterRange(e.target.value)}
          className="border p-2 rounded"
        >
          <option value="24h">Last 24 Hours</option>
          <option value="48h">Last 48 Hours</option>
          <option value="7d">Last 7 Days</option>
          {userRole === 'admin' && <option value="all">All Logs</option>}
        </select>
      </div>

      {/* --- Table --- */}
      <Card className="shadow-lg border rounded-2xl bg-white mt-6">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-700">
            Turnover Log
          </CardTitle>
        </CardHeader>
        <CardContent>
          <table className="w-full border-collapse border border-gray-200 text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="border p-2 text-left">Shift</th>
                <th className="border p-2 text-left">Notes</th>
                <th className="border p-2 text-left">House</th>
                <th className="border p-2 text-left">Submitted By</th>
                <th className="border p-2 text-left">Created</th>
                <th className="border p-2 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {turnovers.map((t) => (
                <tr key={t.id} className="border-t">
                  <td className="border p-2">{t.shift_name}</td>
                  <td className="border p-2 whitespace-pre-line">
                    {t.handover_notes}
                  </td>
                  <td className="border p-2">{t.house?.name || '—'}</td>
                  <td className="border p-2">{t.submitter?.name || '—'}</td>
                  <td className="border p-2">
                    {new Date(t.created_at).toLocaleString()}
                  </td>
                  <td className="border p-2 text-center">
                    {userRole === 'admin' && (
                      <button
                        onClick={() => handleDeleteTurnover(t.id)}
                        className="text-red-600 hover:underline"
                      >
                        Delete
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  )
}
