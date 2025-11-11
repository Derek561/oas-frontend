'use client'

import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

export default function HousingCensusPage() {
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
      console.error('housing vw_room_occupancy error:', error)
      setRows([])
    } else {
      setRows(data || [])
      setLastUpdated(new Date())
    }
    setLoading(false)
  }

  const summary = useMemo(() => {
    const totalBeds = rows.reduce((a, r) => a + (r.capacity || 0), 0)
    const occupied = rows.reduce((a, r) => a + (r.active_residents || 0), 0)
    const available = rows.reduce((a, r) => a + (r.open_beds || 0), 0)
    const pct = totalBeds > 0 ? ((occupied / totalBeds) * 100).toFixed(1) : '0.0'
    return { totalBeds, occupied, available, pct }
  }, [rows])

  // group rooms by house
  const grouped = useMemo(() => {
    const map = new Map()
    for (const r of rows) {
      const key = r.house_name?.trim() || 'Unassigned House'
      const list = map.get(key) || []
      list.push(r)
      map.set(key, list)
    }
    return Array.from(map.entries()).map(([house, rooms]) => ({ house, rooms }))
  }, [rows])

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Housing Census Overview</h1>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchData}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-3 py-2 rounded-md shadow"
          >
            {loading ? 'Refreshing…' : 'Refresh Census'}
          </button>
          <span className="text-sm text-gray-500">
            {lastUpdated ? `Last updated: ${lastUpdated.toLocaleString()}` : ''}
          </span>
        </div>
      </div>

      {/* Top tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Tile title="Total Beds" value={summary.totalBeds} />
        <Tile title="Occupied" value={summary.occupied} />
        <Tile title="Available" value={summary.available} />
        <Tile title="Occupancy %" value={`${summary.pct}%`} />
      </div>

      {/* Per-house cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {grouped.map(({ house, rooms }) => (
          <div key={house} className="bg-white rounded-xl border shadow p-4">
            <h2 className="text-sm font-semibold mb-3">{house}</h2>
            <div className="space-y-3">
              {rooms.map((r) => {
                const pct = Number.isFinite(r.occupancy_rate) ? r.occupancy_rate : 0
                const color = pct >= 90 ? 'text-red-600' : pct >= 70 ? 'text-yellow-600' : 'text-green-600'
                return (
                  <div key={r.room_id} className="border rounded-lg p-3 hover:shadow-sm transition">
                    <div className="flex items-center justify-between">
                      <div className="font-medium">{r.room_number || 'Unnamed Room'}</div>
                      <span className={`text-xs font-semibold ${color}`}>
                        {pct?.toFixed ? `${pct.toFixed(1)}%` : `${pct}%`}
                      </span>
                    </div>
                    <div className="text-xs text-gray-600 mt-1">
                      Beds: <b>{r.capacity ?? 0}</b> — Occupied: <b>{r.active_residents ?? 0}</b> — Available:{' '}
                      <b>{r.open_beds ?? 0}</b> — Status:{' '}
                      <span className="font-medium">{r.status_flag || '—'}</span>
                    </div>
                  </div>
                )
              })}
              {rooms.length === 0 && (
                <div className="text-sm text-gray-500">No rooms.</div>
              )}
            </div>
          </div>
        ))}
        {grouped.length === 0 && (
          <div className="text-sm text-gray-500">No data.</div>
        )}
      </div>
    </div>
  )
}

function Tile({ title, value }) {
  return (
    <div className="bg-white rounded-xl border shadow p-4">
      <div className="text-gray-500 text-sm">{title}</div>
      <div className="text-2xl font-semibold">{value}</div>
    </div>
  )
}
