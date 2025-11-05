'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'

export default function MaintenancePage() {
  const [maintenance, setMaintenance] = useState([])
  const [houses, setHouses] = useState([])
  const [staffList, setStaffList] = useState([])
  const [issue, setIssue] = useState('')
  const [priority, setPriority] = useState('Medium')
  const [assignedTo, setAssignedTo] = useState('')
  const [currentHouse, setCurrentHouse] = useState('')
  const [userRole, setUserRole] = useState('')

  useEffect(() => {
    getUserContext()
    fetchHouses()
  }, [])

  // -------------------------
  //  USER CONTEXT
  // -------------------------
  async function getUserContext() {
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError || !user) {
        console.warn('⚠️ No authenticated user found.')
        return
      }

      const { data: staff, error: staffError } = await supabase
        .from('staff')
        .select('id, role, name, email')
        .eq('email', user.email)
        .maybeSingle()

      if (staffError) console.warn('Staff fetch error:', staffError.message)
      if (!staff) {
        console.warn(`⚠️ No staff record found for ${user.email}`)
        setUserRole('admin')
        fetchMaintenance(null, 'admin')
        return
      }

      setUserRole(staff.role)

      const { data: pin } = await supabase
        .from('staff_pins')
        .select('house_id, houses(name)')
        .eq('staff_id', staff.id)
        .maybeSingle()

      if (pin?.houses?.name) setCurrentHouse(pin.houses.name)
      fetchMaintenance(pin?.house_id || null, staff.role)
      fetchStaffList()
    } catch (err) {
      console.error('Error loading user context:', err.message)
    }
  }

  // -------------------------
  //  FETCH DATA
  // -------------------------
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

  // ✅ Fetch from view (not joined table)
  async function fetchMaintenance(houseId = null, role = '') {
    try {
      let query = supabase
        .from('v_maintenance_list')
        .select('*')
        .order('created_at', { ascending: false })

      if (houseId && role !== 'admin') {
        query = query.eq('house_id', houseId)
      }

      const { data, error } = await query
      if (error) throw error
      setMaintenance(data || [])
    } catch (err) {
      console.error('Fetch maintenance failed:', err.message)
    }
  }

  // -------------------------
  //  ACTIONS
  // -------------------------
  async function handleAddIssue(e) {
    e.preventDefault()
    if (!issue.trim()) return alert('Please describe the issue.')

    const { error } = await supabase.from('maintenance').insert([
      {
        issue,
        priority,
        status: 'Open',
        house_id:
          houses.find((h) => h.name === currentHouse)?.id || houses[0]?.id || null,
        submitted_by: assignedTo || null,
      },
    ])

    if (error) return alert('⚠️ Error adding issue.')
    alert('✅ Issue logged successfully.')
    setIssue('')
    setPriority('Medium')
    fetchMaintenance()
  }

  async function handleResolveIssue(id) {
    const { error } = await supabase
      .from('maintenance')
      .update({ status: 'Resolved', resolved_at: new Date().toISOString() })
      .eq('id', id)

    if (!error) fetchMaintenance()
  }

  async function handleDeleteIssue(id) {
    if (!confirm('Are you sure you want to delete this issue?')) return
    const { error } = await supabase.from('maintenance').delete().eq('id', id)
    if (!error) fetchMaintenance()
  }

  // -------------------------
  //  UI
  // -------------------------
  return (
    <div className="p-6 space-y-6">
      <h2 className="text-2xl font-semibold">Maintenance Dashboard</h2>
      <p className="text-sm text-gray-600">
        Currently Viewing:{' '}
        <strong>{currentHouse || 'All Houses (Admin)'}</strong>
      </p>

      {/* --- Add New Issue Form --- */}
      <Card className="p-4 shadow-sm">
        <form
          onSubmit={handleAddIssue}
          className="grid md:grid-cols-4 gap-3 items-center"
        >
          <input
            type="text"
            value={issue}
            onChange={(e) => setIssue(e.target.value)}
            placeholder="Describe issue"
            className="border p-2 rounded"
            required
          />
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            className="border p-2 rounded"
          >
            <option>Low</option>
            <option>Medium</option>
            <option>High</option>
          </select>

          <select
            value={assignedTo}
            onChange={(e) => setAssignedTo(e.target.value)}
            className="border p-2 rounded"
          >
            <option value="">Assign to...</option>
            {staffList.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>

          <button
            type="submit"
            className="bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
          >
            Add Issue
          </button>
        </form>
      </Card>

      {/* --- Maintenance Table --- */}
      <Card className="shadow-lg border rounded-2xl bg-white mt-6">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-700">
            Maintenance Requests
          </CardTitle>
        </CardHeader>
        <CardContent>
          <table className="w-full border-collapse border border-gray-200 text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="border p-2 text-left">Issue</th>
                <th className="border p-2 text-left">Priority</th>
                <th className="border p-2 text-left">Status</th>
                <th className="border p-2 text-left">Assigned Staff</th>
                <th className="border p-2 text-left">Submitted By</th>
                <th className="border p-2 text-left">House</th>
                <th className="border p-2 text-left">Created</th>
                <th className="border p-2 text-left">Resolved</th>
                <th className="border p-2 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {maintenance.map((m) => (
                <tr key={m.id} className="border-t">
                  <td className="border p-2">{m.issue}</td>
                  <td className="border p-2">{m.priority}</td>
                  <td className="border p-2">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        m.status === 'Open'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-green-100 text-green-800'
                      }`}
                    >
                      {m.status}
                    </span>
                  </td>
                  <td className="border p-2">{m.assigned_to_name || '—'}</td>
                  <td className="border p-2">{m.submitted_by_name || '—'}</td>
                  <td className="border p-2">{m.house_name || '—'}</td>
                  <td className="border p-2">
                    {new Date(m.created_at).toLocaleDateString()}
                  </td>
                  <td className="border p-2">
                    {m.resolved_at
                      ? new Date(m.resolved_at).toLocaleDateString()
                      : '—'}
                  </td>
                  <td className="border p-2 text-center space-x-3">
                    {m.status === 'Open' && (
                      <button
                        onClick={() => handleResolveIssue(m.id)}
                        className="text-blue-600 hover:underline"
                      >
                        Resolve
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteIssue(m.id)}
                      className="text-red-600 hover:underline"
                    >
                      Delete
                    </button>
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
