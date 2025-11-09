'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'

export default function ObservationPage() {
  const [observations, setObservations] = useState([])
  const [residents, setResidents] = useState([])
  const [houses, setHouses] = useState([])
  const [noteText, setNoteText] = useState('')
  const [residentId, setResidentId] = useState('')
  const [shiftName, setShiftName] = useState('')
  const [filterRange, setFilterRange] = useState('24h')
  const [userRole, setUserRole] = useState('')
  const [currentHouse, setCurrentHouse] = useState('')
  const [currentHouseId, setCurrentHouseId] = useState(null)

  useEffect(() => {
    getUserContext()
    fetchHouses()
  }, [filterRange])

  // 🧠 Load user, staff, and context
  async function getUserContext() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return console.warn('⚠️ No authenticated user.')

      const { data: staff } = await supabase
        .from('staff')
        .select('id, role, name, email')
        .eq('email', user.email)
        .maybeSingle()

      if (!staff) {
        setUserRole('admin')
        fetchResidents(null, 'admin')
        fetchObservations(null, 'admin')
        return
      }

      setUserRole(staff.role)

      const { data: pin } = await supabase
        .from('staff_pins')
        .select('house_id, houses(name)')
        .eq('staff_id', staff.id)
        .maybeSingle()

      if (pin?.houses?.name) setCurrentHouse(pin.houses.name)
      if (pin?.house_id) setCurrentHouseId(pin.house_id)

      fetchResidents(pin?.house_id || null, staff.role)
      fetchObservations(pin?.house_id || null, staff.role)
    } catch (err) {
      console.error('Error loading user context:', err.message)
    }
  }

  // 🏠 Fetch houses
  async function fetchHouses() {
    const { data, error } = await supabase.from('houses').select('id, name')
    if (!error) setHouses(data)
  }

  // 👥 Fetch residents (filter by house if not admin)
  async function fetchResidents(houseId = null, role = '') {
    let query = supabase.from('residents').select('id, first_name, last_name, house_id')
    if (houseId && role !== 'admin') query = query.eq('house_id', houseId)

    const { data, error } = await query
    if (!error) setResidents(data || [])
  }

  // 👁️ Fetch observation notes (joins residents by resident_id)
  async function fetchObservations(houseId = null, role = '') {
    try {
      const now = new Date()
      let since = new Date(now)
      if (filterRange === '24h') since.setHours(now.getHours() - 24)
      else if (filterRange === '48h') since.setHours(now.getHours() - 48)
      else if (filterRange === '7d') since.setDate(now.getDate() - 7)
      else since = new Date('2000-01-01')

      let query = supabase
        .from('observation_notes')
        .select(`
          id,
          shift_name,
          note_text,
          created_at,
          resident:resident_id(first_name, last_name),
          house:house_id(name),
          submitter:submitted_by(name)
        `)
        .gte('created_at', since.toISOString())
        .order('created_at', { ascending: false })

      if (houseId && role !== 'admin') query = query.eq('house_id', houseId)

      const { data, error } = await query
      if (error) throw error
      setObservations(data || [])
    } catch (err) {
      console.error('Fetch observations failed:', err.message)
    }
  }

  // ➕ Add new note
  async function handleAddObservation(e) {
    e.preventDefault()
    if (!noteText.trim() || !residentId || !shiftName)
      return alert('Please complete all fields before submitting.')

    const {
      data: { user },
    } = await supabase.auth.getUser()

    const { data: staff } = await supabase
      .from('staff')
      .select('id')
      .eq('email', user.email)
      .maybeSingle()

    const resident = residents.find((r) => r.id === residentId)
    const houseId = resident?.house_id || currentHouseId || houses[0]?.id || null

    const payload = {
      resident_id: residentId,
      shift_name: shiftName,
      note_text: noteText,
      submitted_by: staff?.id || null,
      house_id: houseId,
    }

    const { error } = await supabase.from('observation_notes').insert([payload])
    if (error) {
      console.error('Insert error:', error.message)
      return alert('⚠️ Error adding observation entry.')
    }

    alert('✅ Observation logged successfully.');
setResidents((prev) => prev.filter((r) => r.rid !== residentId));
setResidentId('');
setShiftName('');
setNoteText('');
fetchObservations(currentHouseId, userRole);
  }

  // ❌ Delete note
  async function handleDeleteObservation(id) {
    if (userRole !== 'admin')
      return alert('❌ Only Admins can delete observation entries.')

    if (!confirm('Are you sure you want to delete this observation?')) return

    const { error } = await supabase.from('observation_notes').delete().eq('id', id)
    if (error) return alert('⚠️ Error deleting observation entry.')

    fetchObservations(currentHouseId, userRole)
  }

  // 🧩 Helper to display full name
  function fullName(resident) {
    if (!resident) return '—'
    return `${resident.first_name || ''} ${resident.last_name || ''}`.trim() || '—'
  }

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-2xl font-semibold">Observation Notes Dashboard</h2>

      <p className="text-sm text-gray-600">
        Currently Viewing:{' '}
        <strong>{currentHouse || 'All Houses (Admin)'}</strong>
      </p>

      {/* Form */}
      <Card className="p-4 shadow-sm">
        <form
          onSubmit={handleAddObservation}
          className="grid md:grid-cols-5 gap-3 items-center"
        >
          <select
            value={residentId}
            onChange={(e) => setResidentId(e.target.value)}
            className="border p-2 rounded"
            required
          >
            <option value="">Select Resident</option>
            {residents.map((r) => (
              <option key={r.id} value={r.id}>
                {`${r.first_name} ${r.last_name}`}
              </option>
            ))}
          </select>

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
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            placeholder="Observation Notes"
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

      {/* Filter */}
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

      {/* Table */}
      <Card className="shadow-lg border rounded-2xl bg-white mt-6">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-700">
            Observation Log
          </CardTitle>
        </CardHeader>
        <CardContent>
          <table className="w-full border-collapse border border-gray-200 text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="border p-2 text-left">Resident</th>
                <th className="border p-2 text-left">House</th>
                <th className="border p-2 text-left">Shift</th>
                <th className="border p-2 text-left">Notes</th>
                <th className="border p-2 text-left">Submitted By</th>
                <th className="border p-2 text-left">Created</th>
                <th className="border p-2 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {observations.map((o) => (
                <tr key={o.id} className="border-t">
                  <td className="border p-2">{fullName(o.resident)}</td>
                  <td className="border p-2">{o.house?.name || '—'}</td>
                  <td className="border p-2">{o.shift_name || '—'}</td>
                  <td className="border p-2 whitespace-pre-line">{o.note_text}</td>
                  <td className="border p-2">{o.submitter?.name || '—'}</td>
                  <td className="border p-2">
                    {new Date(o.created_at).toLocaleString()}
                  </td>
                  <td className="border p-2 text-center">
                    {userRole === 'admin' && (
                      <button
                        onClick={() => handleDeleteObservation(o.id)}
                        className="text-red-600 hover:underline"
                      >
                        Delete
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {observations.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center p-4 text-gray-500">
                    No observation notes found for this time period.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  )
}
