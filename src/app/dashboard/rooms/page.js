'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

export default function RoomsPage() {
  const [rooms, setRooms] = useState([])
  const [houses, setHouses] = useState([])
  const [selectedHouse, setSelectedHouse] = useState('')
  const [roomNumber, setRoomNumber] = useState('')
  const [capacity, setCapacity] = useState('')

  useEffect(() => {
    fetchHouses()
    fetchRooms()
  }, [])

  // Fetch all houses for dropdown
  async function fetchHouses() {
    const { data, error } = await supabase.from('houses').select('id, name').order('name')
    if (error) console.error('Error fetching houses:', error)
    else setHouses(data)
  }

  // Fetch all rooms
  async function fetchRooms() {
    const { data, error } = await supabase
      .from('rooms')
      .select('*, houses(name)')
      .order('created_at', { ascending: false })

    if (error) console.error('Error fetching rooms:', error)
    else setRooms(data)
  }

  // Add new room
  async function handleAddRoom(e) {
    e.preventDefault()
    if (!selectedHouse) {
      alert('Please select a house.')
      return
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      alert('User must be logged in.')
      return
    }

    const { error } = await supabase.from('rooms').insert({
      house_id: selectedHouse,
      room_number: roomNumber,
      capacity: parseInt(capacity) || 0,
    })

    if (error) {
      console.error('Error adding room:', error)
      alert('Error adding room.')
    } else {
      alert('Room added successfully.')
      setRoomNumber('')
      setCapacity('')
      setSelectedHouse('')
      fetchRooms()
    }
  }

  // Delete a room
  async function handleDeleteRoom(id) {
    if (!confirm('Are you sure you want to delete this room?')) return
    const { error } = await supabase.from('rooms').delete().eq('id', id)
    if (error) console.error('Error deleting room:', error)
    else fetchRooms()
  }

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-4">Rooms</h2>

      <form onSubmit={handleAddRoom} className="space-y-2 mb-6">
        <select
          value={selectedHouse}
          onChange={(e) => setSelectedHouse(e.target.value)}
          className="border p-2 w-full rounded"
          required
        >
          <option value="">Select House</option>
          {houses.map((h) => (
            <option key={h.id} value={h.id}>
              {h.name}
            </option>
          ))}
        </select>

        <input
          type="text"
          placeholder="Room Number"
          value={roomNumber}
          onChange={(e) => setRoomNumber(e.target.value)}
          className="border p-2 w-full rounded"
          required
        />

        <input
          type="number"
          placeholder="Capacity"
          value={capacity}
          onChange={(e) => setCapacity(e.target.value)}
          className="border p-2 w-full rounded"
        />

        <button type="submit" className="bg-blue-500 text-white p-2 rounded">
          Add Room
        </button>
      </form>

      <table className="w-full border-collapse border border-gray-300">
        <thead>
          <tr className="bg-gray-100">
            <th className="border p-2">House</th>
            <th className="border p-2">Room</th>
            <th className="border p-2">Capacity</th>
            <th className="border p-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {rooms.map((r) => (
            <tr key={r.id}>
              <td className="border p-2">{r.houses?.name || '—'}</td>
              <td className="border p-2">{r.room_number}</td>
              <td className="border p-2">{r.capacity}</td>
              <td className="border p-2 text-center">
                <button
                  onClick={() => handleDeleteRoom(r.id)}
                  className="bg-red-500 text-white px-3 py-1 rounded"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
