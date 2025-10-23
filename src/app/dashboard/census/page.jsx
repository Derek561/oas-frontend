'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

export default function CensusPage() {
  const [census, setCensus] = useState([])
  const [houses, setHouses] = useState([])
  const [selectedHouse, setSelectedHouse] = useState('')
  const [totalCapacity, setTotalCapacity] = useState('')
  const [activeCount, setActiveCount] = useState('')

  useEffect(() => {
    fetchCensus()
    fetchHouses()
  }, [])

  async function fetchHouses() {
    const { data, error } = await supabase.from('houses').select('id, name')
    if (error) console.error('Error fetching houses:', error)
    else setHouses(data)
  }

  async function fetchCensus() {
    const { data, error } = await supabase
      .from('census')
      .select('*, houses(name)')
      .order('census_date', { ascending: false })
    if (error) console.error('Error fetching census:', error)
    else setCensus(data)
  }

  async function handleAddCensus(e) {
  e.preventDefault()

  const { error } = await supabase.from('census').insert({
    house_id: selectedHouse,
    active_count: parseInt(activeCount) || 0,
    census_date: new Date().toISOString().split('T')[0]
  })

  if (error) {
    console.error('Error adding census:', error)
    alert('Error adding census record.')
  } else {
    alert('Census record added successfully.')
    setSelectedHouse('')
    setActiveCount('')
    fetchCensus()
  }
}

  async function handleDeleteCensus(id) {
    if (!confirm('Are you sure you want to delete this record?')) return
    const { error } = await supabase.from('census').delete().eq('id', id)
    if (error) console.error('Error deleting record:', error)
    else fetchCensus()
  }

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-4">Census Dashboard</h2>

      <form onSubmit={handleAddCensus} className="space-y-2 mb-6">
        <select
          value={selectedHouse}
          onChange={(e) => setSelectedHouse(e.target.value)}
          className="border p-2 w-full rounded"
          required
        >
          <option value="">Select House</option>
          {houses.map((h) => (
            <option key={h.id} value={h.id}>{h.name}</option>
          ))}
        </select>

        <input
          type="number"
          placeholder="Total Capacity"
          value={totalCapacity}
          onChange={(e) => setTotalCapacity(e.target.value)}
          className="border p-2 w-full rounded"
        />

        <input
          type="number"
          placeholder="Active Residents"
          value={activeCount}
          onChange={(e) => setActiveCount(e.target.value)}
          className="border p-2 w-full rounded"
        />

        <button type="submit" className="bg-blue-500 text-white p-2 rounded">
          Add Record
        </button>
      </form>

      <table className="w-full border-collapse border border-gray-300">
        <thead>
          <tr className="bg-gray-100">
            <th className="border p-2">Date</th>
            <th className="border p-2">House</th>
            <th className="border p-2">Total Capacity</th>
            <th className="border p-2">Active Count</th>
            <th className="border p-2">Occupancy %</th>
            <th className="border p-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {census.map((c) => (
            <tr key={c.id}>
              <td className="border p-2">{c.census_date}</td>
              <td className="border p-2">{c.houses?.name || '—'}</td>
              <td className="border p-2">{c.total_capacity}</td>
              <td className="border p-2">{c.active_count}</td>
              <td className="border p-2">{c.occupancy_rate}%</td>
              <td className="border p-2 text-center">
                <button
                  onClick={() => handleDeleteCensus(c.id)}
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
