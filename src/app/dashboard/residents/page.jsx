'use client'

import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

export default function ResidentsPage() {
  const [houses, setHouses] = useState([])
  const [rooms, setRooms] = useState([])
  const [residents, setResidents] = useState([])

  // Form state
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [status, setStatus] = useState('Active')
  const [admissionDate, setAdmissionDate] = useState('')
  const [selectedHouse, setSelectedHouse] = useState('')
  const [selectedRoom, setSelectedRoom] = useState('')

  // Filter rooms by selected house
  const availableRooms = useMemo(
    () => rooms.filter((r) => r.house_id === selectedHouse),
    [rooms, selectedHouse]
  )

  // Initial load
  useEffect(() => {
    fetchHouses()
    fetchRooms()
    fetchResidents()
  }, [])

  // Fetch houses
  async function fetchHouses() {
    const { data, error } = await supabase
      .from('houses')
      .select('id, name')
      .order('name', { ascending: true })
    if (error) console.error('Error fetching houses:', error)
    else setHouses(data || [])
  }

  // Fetch rooms
  async function fetchRooms() {
    const { data, error } = await supabase
      .from('rooms')
      .select('id, room_number, capacity, house_id')
      .order('room_number', { ascending: true })
    if (error) console.error('Error fetching rooms:', error)
    else setRooms(data || [])
  }

  // ✅ Fetch residents (with correct foreign key joins)
  async function fetchResidents() {
    const { data, error } = await supabase
      .from('residents')
      .select(`
        id,
        first_name,
        last_name,
        status,
        admission_date,
        discharge_date,
        houses!residents_house_fk (
          id, name, address
        ),
        rooms!residents_room_fk (
          id, room_number, capacity
        ),
        beds!residents_bed_id_fkey (
          id
        )
      `)
      .order('admission_date', { ascending: false })

    if (error) {
      console.error('Error fetching residents:', error)
    } else {
      setResidents(data || [])
    }
  }

  // ✅ Add resident
  async function handleAddResident(e) {
    e.preventDefault()

    if (!firstName.trim() || !lastName.trim()) {
      alert('Please enter both first and last name.')
      return
    }
    if (!selectedHouse) {
      alert('Please select a house.')
      return
    }

    const { error } = await supabase.from('residents').insert({
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      status,
      admission_date: admissionDate || null,
      house_id: selectedHouse,
      room_id: selectedRoom || null,
    })

    if (error) {
      console.error('Error adding resident:', error)
      alert('Error adding resident.')
      return
    }

    // Reset and refresh
    setFirstName('')
    setLastName('')
    setStatus('Active')
    setAdmissionDate('')
    setSelectedHouse('')
    setSelectedRoom('')
    fetchResidents()
  }

  // ✅ Delete resident
  async function handleDeleteResident(id) {
    if (!confirm('Are you sure you want to delete this resident?')) return
    const { error } = await supabase.from('residents').delete().eq('id', id)
    if (error) {
      console.error('Error deleting resident:', error)
      alert('Error deleting resident.')
      return
    }
    fetchResidents()
  }

  // ✅ Render UI
  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-4">Residents</h2>

      {/* Create Resident Form */}
      <form
        onSubmit={handleAddResident}
        className="grid grid-cols-1 md:grid-cols-6 gap-2 mb-6"
      >
        <input
          type="text"
          placeholder="First name"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          className="border p-2 rounded"
          required
        />

        <input
          type="text"
          placeholder="Last name"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          className="border p-2 rounded"
          required
        />

        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="border p-2 rounded"
        >
          <option>Active</option>
          <option>Inactive</option>
          <option>Pending</option>
        </select>

        <input
          type="date"
          value={admissionDate}
          onChange={(e) => setAdmissionDate(e.target.value)}
          className="border p-2 rounded"
        />

        <select
          value={selectedHouse}
          onChange={(e) => {
            setSelectedHouse(e.target.value)
            setSelectedRoom('')
          }}
          className="border p-2 rounded"
        >
          <option value="">Select house</option>
          {houses.map((h) => (
            <option key={h.id} value={h.id}>
              {h.name}
            </option>
          ))}
        </select>

        <select
          value={selectedRoom}
          onChange={(e) => setSelectedRoom(e.target.value)}
          className="border p-2 rounded"
          disabled={!selectedHouse}
        >
          <option value="">(Optional) Room</option>
          {availableRooms.map((r) => (
            <option key={r.id} value={r.id}>
              {r.room_number}
            </option>
          ))}
        </select>

        <div className="md:col-span-6">
          <button
            type="submit"
            className="bg-blue-500 text-white px-4 py-2 rounded"
          >
            Add Resident
          </button>
        </div>
      </form>

      {/* Resident List */}
      <table className="w-full border-collapse border border-gray-300">
        <thead>
          <tr className="bg-gray-100">
            <th className="border p-2 text-left">Name</th>
            <th className="border p-2 text-left">House</th>
            <th className="border p-2 text-left">Room</th>
            <th className="border p-2 text-left">Status</th>
            <th className="border p-2 text-left">Admission</th>
            <th className="border p-2 text-center">Actions</th>
          </tr>
        </thead>
        <tbody>
          {residents.map((r) => (
            <tr key={r.id}>
              <td className="border p-2">
                {r.first_name} {r.last_name}
              </td>
              <td className="border p-2">{r.houses?.name ?? '—'}</td>
              <td className="border p-2">{r.rooms?.room_number ?? '—'}</td>
              <td className="border p-2">{r.status}</td>
              <td className="border p-2">{r.admission_date ?? '—'}</td>
              <td className="border p-2 text-center">
                <button
                  onClick={() => handleDeleteResident(r.id)}
                  className="bg-red-500 text-white px-3 py-1 rounded"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
          {residents.length === 0 && (
            <tr>
              <td
                className="border p-2 text-center text-gray-500"
                colSpan={6}
              >
                No residents yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
