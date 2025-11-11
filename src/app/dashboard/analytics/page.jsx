'use client'

import { useEffect, useState, useMemo } from 'react'
import { supabase } from '@/lib/supabaseClient'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'

export default function AnalyticsPage() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [lastUpdated, setLastUpdated] = useState(null)

  useEffect(() => { fetchData() }, [])

  async function fetchData() {
    setLoading(true)
    const { data, error } = await supabase
      .from('vw_room_occupancy')
      .select('*')
      .order('house_name', { ascending: true })
      .order('room_number', { ascending: true })

    if (error) {
      console.error('analytics vw_room_occupancy error:', error)
      setRows([])
    } else {
      setRows(data || [])
      setLastUpdated(new Date())
    }
    setLoading(false)
  }

  const summary = useMemo(() => {
    const totalBeds = rows.reduce((a, r) => a + (r.capacity || 0), 0)
    const totalResidents = rows.reduce((a, r) => a + (r.active_residents || 0), 0)
    const overCapacity = rows.filter(r => (r.active_residents || 0) > (r.capacity || 0)).length
    const avgPct = totalBeds > 0 ? ((totalResidents / totalBeds) * 100).toFixed(1) : '0.0'
    return { totalBeds, totalResidents, avgPct, overCapacity }
  }, [rows])

  // Aggregate to house level for chart + table
  const byHouse = useMemo(() => {
    const map = new Map()
    for (const r of rows) {
      const key = r.house_name?.trim() || 'Unassigned House'
      const item = map.get(key) || { house: key, total_capacity: 0, active_count: 0, last_census: null }
      item.total_capacity += r.capacity || 0
      item.active_count += r.active_residents || 0
      map.set(key, item)
    }
    return Array.from(map.values())
  }, [rows])

  return (
    <div className="p-6 space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Census Intelligence Dashboard</h2>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchData}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-3 py-2 rounded-md shadow"
          >
            {loading ? 'Refreshing…' : 'Refresh'}
          </button>
          <span className="text-sm text-gray-500">
            {lastUpdated ? `Last updated: ${lastUpdated.toLocaleString()}` : ''}
          </span>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card title="Total Beds" value={summary.totalBeds} />
        <Card title="Active Residents" value={summary.totalResidents} />
        <Card title="Avg Occupancy %" value={`${summary.avgPct}%`} />
        <Card
          title="Over-Capacity Alerts"
          value={summary.overCapacity}
          valueClass={summary.overCapacity > 0 ? 'text-red-600' : 'text-green-600'}
        />
      </div>

      {/* House bar chart */}
      <div className="bg-white border rounded-xl shadow p-4">
        <h3 className="font-medium mb-3">House Occupancy Overview</h3>
        <ResponsiveContainer width="100%" height={340}>
          <BarChart data={byHouse} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="house" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="active_count" name="Active Count" />
            <Bar dataKey="total_capacity" name="Total Capacity" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* House table */}
      <div className="bg-white border rounded-xl shadow">
        <table className="w-full border-collapse">
          <thead className="bg-gray-50">
            <tr>
              <Th>House</Th>
              <Th className="text-center">Total Capacity</Th>
              <Th className="text-center">Active Count</Th>
              <Th className="text-center">Occupancy %</Th>
            </tr>
          </thead>
          <tbody>
            {byHouse.map(h => {
              const pct = h.total_capacity > 0 ? ((h.active_count / h.total_capacity) * 100) : 0
              const color = pct >= 90 ? 'text-red-600' : pct >= 70 ? 'text-yellow-600' : 'text-green-600'
              return (
                <tr key={h.house} className="border-t">
                  <Td>{h.house}</Td>
                  <Td className="text-center">{h.total_capacity}</Td>
                  <Td className="text-center">{h.active_count}</Td>
                  <Td className={`text-center font-semibold ${color}`}>{pct.toFixed(1)}%</Td>
                </tr>
              )
            })}
            {byHouse.length === 0 && (
              <tr><Td colSpan={4} className="text-center text-gray-500 py-6">No data</Td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function Card({ title, value, valueClass = '' }) {
  return (
    <div className="bg-white shadow rounded-xl p-4 border">
      <h3 className="text-gray-500 text-sm">{title}</h3>
      <p className={`text-2xl font-semibold ${valueClass}`}>{value}</p>
    </div>
  )
}

function Th({ children, className = '' }) {
  return <th className={`p-3 text-left text-sm font-medium text-gray-700 ${className}`}>{children}</th>
}
function Td({ children, className = '', colSpan }) {
  return <td colSpan={colSpan} className={`p-3 text-sm ${className}`}>{children}</td>
}
