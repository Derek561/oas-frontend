'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

export default function CensusPage() {
  const [census, setCensus] = useState([])

  useEffect(() => {
    async function fetchCensus() {
      const { data, error } = await supabase
        .from('census')
        .select('*')
        .order('date', { ascending: false })
      if (!error) setCensus(data || [])
    }
    fetchCensus()
  }, [])

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-4">Census Overview</h2>
      <table className="w-full border-collapse border border-gray-300">
        <thead>
          <tr className="bg-gray-100">
            <th className="border p-2">Date</th>
            <th className="border p-2">Occupied Beds</th>
            <th className="border p-2">Vacant Beds</th>
          </tr>
        </thead>
        <tbody>
          {census.map((row) => (
            <tr key={row.id}>
              <td className="border p-2">{new Date(row.date).toLocaleDateString()}</td>
              <td className="border p-2">{row.occupied}</td>
              <td className="border p-2">{row.vacant}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
