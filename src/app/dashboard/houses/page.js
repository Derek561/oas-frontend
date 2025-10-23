'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

export default function HousesPage() {
  const [houses, setHouses] = useState([])
  const [name, setName] = useState('')
  const [gender, setGender] = useState('Female')
  const [address, setAddress] = useState('')

  useEffect(() => {
    fetchHouses()
  }, [])

  async function fetchHouses() {
    const { data, error } = await supabase
      .from('houses')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) console.error('Error fetching houses:', error)
    else setHouses(data)
  }

  async function handleAddHouse(e) {
    e.preventDefault()

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      alert('User must be logged in.')
      return
    }

    const { error } = await supabase.from('houses').insert({
      name,
      gender,
      address,
      user_id: user.id,
    })

    if (error) {
      console.error('Error adding house:', error)
      alert('Error adding house.')
    } else {
      alert('House added successfully.')
      setName('')
      setGender('Female')
      setAddress('')
      fetchHouses()
    }
  }

  async function handleDeleteHouse(id) {
    if (!confirm('Are you sure you want to delete this house?')) return

    const { error } = await supabase.from('houses').delete().eq('id', id)
    if (error) console.error('Error deleting house:', error)
    else fetchHouses()
  }

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-4">Houses</h2>

      <form onSubmit={handleAddHouse} className="space-y-2 mb-6">
        <input
          type="text"
          placeholder="House Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="border p-2 w-full rounded"
          required
        />
        <input
          type="text"
          placeholder="Address"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          className="border p-2 w-full rounded"
        />
        <select
          value={gender}
          onChange={(e) => setGender(e.target.value)}
          className="border p-2 w-full rounded"
        >
          <option>Female</option>
          <option>Male</option>
          <option>Coed</option>
        </select>

        <button type="submit" className="bg-blue-500 text-white p-2 rounded">
          Add House
        </button>
      </form>

      <table className="w-full border-collapse border border-gray-300">
        <thead>
          <tr className="bg-gray-100">
            <th className="border p-2">Name</th>
            <th className="border p-2">Gender</th>
            <th className="border p-2">Address</th>
            <th className="border p-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {houses.map((h) => (
            <tr key={h.id}>
              <td className="border p-2">{h.name}</td>
              <td className="border p-2">{h.gender}</td>
              <td className="border p-2">{h.address}</td>
              <td className="border p-2 text-center">
                <button
                  onClick={() => handleDeleteHouse(h.id)}
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
