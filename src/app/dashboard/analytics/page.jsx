'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'

export default function AnalyticsPage() {
  const [data, setData] = useState([])
  const [summary, setSummary] = useState({})

  useEffect(() => {
    fetchAnalytics()
  }, [])

  async function fetchAnalytics() {
    const { data, error } = await supabase.from('census_intelligence').select('*')
    if (error) console.error('Error fetching analytics:', error)
    else {
      setData(data)
      calculateSummary(data)
    }
  }

  function calculateSummary(rows) {
    const totalBeds = rows.reduce((a, b) => a + (b.total_capacity || 0), 0)
    const totalResidents = rows.reduce((a, b) => a + (b.active_count || 0), 0)
    const avgOccupancy = rows.length
      ? (rows.reduce((a, b) => a + (b.occupancy_percent || 0), 0) / rows.length).toFixed(1)
      : 0
    const overCapacity = rows.filter(r => r.occupancy_percent > 100).length
    setSummary({ totalBeds, totalResidents, avgOccupancy, overCapacity })
  }

  return (
    <div className="p-6 space-y-8">
      <h2 className="text-xl font-semibold mb-4">Census Intelligence Dashboard</h2>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white shadow rounded-xl p-4 border">
          <h3 className="text-gray-500 text-sm">Total Beds</h3>
          <p className="text-2xl font-semibold">{summary.totalBeds ?? 0}</p>
        </div>
        <div className="bg-white shadow rounded-xl p-4 border">
          <h3 className="text-gray-500 text-sm">Active Residents</h3>
          <p className="text-2xl font-semibold">{summary.totalResidents ?? 0}</p>
        </div>
        <div className="bg-white shadow rounded-xl p-4 border">
          <h3 className="text-gray-500 text-sm">Avg Occupancy %</h3>
          <p className="text-2xl font-semibold">{summary.avgOccupancy ?? 0}%</p>
        </div>
        <div className="bg-white shadow rounded-xl p-4 border">
          <h3 className="text-gray-500 text-sm">Over-Capacity Alerts</h3>
          <p className={`text-2xl font-semibold ${summary.overCapacity > 0 ? 'text-red-600' : 'text-green-600'}`}>
            {summary.overCapacity}
          </p>
        </div>
      </div>

      {/* Recharts Graph */}
      <div className="bg-white border rounded-xl shadow p-4">
        <h3 className="font-medium mb-3">House Occupancy Overview</h3>
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="house_name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="total_capacity" fill="#cbd5e1" name="Total Capacity" />
            <Bar dataKey="active_count" fill="#3b82f6" name="Active Count" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Existing Table */}
      <div>
        <table className="w-full border-collapse border border-gray-300">
          <thead className="bg-gray-100">
            <tr>
              <th className="border p-2">House</th>
              <th className="border p-2">Total Capacity</th>
              <th className="border p-2">Active Count</th>
              <th className="border p-2">Occupancy %</th>
              <th className="border p-2">Last Census</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row) => (
              <tr key={row.house_id}>
                <td className="border p-2">{row.house_name}</td>
                <td className="border p-2 text-center">{row.total_capacity}</td>
                <td className="border p-2 text-center">{row.active_count}</td>
                <td className={`border p-2 text-center font-semibold ${
                  row.occupancy_percent >= 90
                    ? 'text-red-600'
                    : row.occupancy_percent >= 70
                    ? 'text-yellow-600'
                    : 'text-green-600'
                }`}>
                  {row.occupancy_percent}%
                </td>
                <td className="border p-2 text-center">{row.last_census_date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
