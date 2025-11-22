'use client'

/**
 * Oceanside Housing – Operations Dashboard (Stable Build v2.3)
 * --------------------------------------------------------------
 * - Replaced “Rooms” card → “Total Rooms / Rooms with Vacancy”
 * - Removed Admin Office from all census & charts
 * - Total rooms now dynamic from DB
 * - Fully production-safe for Netlify + Supabase RLS
 */

import { useEffect, useMemo, useState } from 'react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts'
import { supabase } from '@/lib/supabaseClient'
import Link from 'next/link'

// ─────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────
export default function OperationsHome() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [houses, setHouses] = useState([])
  const [beds, setBeds] = useState([])
  const [rooms, setRooms] = useState([])
  const [residents, setResidents] = useState([])
  const [censusSnapshots, setCensusSnapshots] = useState([])
  const [turnover, setTurnover] = useState([])
  const [maintenance, setMaintenance] = useState([])

  // ─────────────────────────────────────────────
  // INITIAL LOAD
  // ─────────────────────────────────────────────
  useEffect(() => {
    let alive = true

    async function load() {
      try {
        setLoading(true)

        const [
          { data: houseRows },
          { data: bedRows },
          { data: roomRows },
          { data: residentRows },
          { data: censusRows },
          { data: turnoverRows },
          { data: maintenanceRows }
        ] = await Promise.all([
          supabase.from('houses').select('id, name').order('name', { ascending: true }),
          supabase.from('beds').select('id, house_id, occupied_by'),
          supabase.from('rooms').select('id, house_id'),
          supabase.from('residents').select('id, house_id, status').eq('status', 'Active'),
          supabase.from('census_snapshots').select('house_id, created_at').order('created_at', { ascending: false }),
          supabase.from('shift_turnover').select('*').order('created_at', { ascending: false }).limit(5),
          supabase.from('maintenance').select('id, status').in('status', ['Open', 'In Progress'])
        ])

        if (!alive) return

        setHouses(houseRows || [])
        setBeds(bedRows || [])
        setRooms(roomRows || [])
        setResidents(residentRows || [])
        setCensusSnapshots(censusRows || [])
        setTurnover(turnoverRows || [])
        setMaintenance(maintenanceRows || [])

      } catch (err) {
        console.error(err)
        if (alive) setError(err.message)
      } finally {
        if (alive) setLoading(false)
      }
    }

    load()
    return () => { alive = false }
  }, [])

  // ─────────────────────────────────────────────
  // FILTER OUT ADMIN OFFICE (your request)
  // ─────────────────────────────────────────────
  const filteredHouses = useMemo(() =>
    houses.filter(
      (h) => !h.name.toLowerCase().includes('admin')
    ),
    [houses]
  )

  // ─────────────────────────────────────────────
  // CAPACITY MAP (static for now)
  // ─────────────────────────────────────────────
  const houseCapacities = {
    'oceanside house a': 18,
    'oceanside house b': 10,
    'blue building': 11,
  }

  // ─────────────────────────────────────────────
  // AGGREGATE CENSUS DATA
  // ─────────────────────────────────────────────
  const byHouse = useMemo(() => {
    const lastCensus = new Map()
    for (const snap of censusSnapshots) {
      if (!lastCensus.has(snap.house_id)) {
        lastCensus.set(snap.house_id, snap.created_at)
      }
    }

    return filteredHouses.map((h) => {
      const key = h.name.trim().toLowerCase()
      const capacity = houseCapacities[key] || 0

      const activeResidents = residents.filter((r) => r.house_id === h.id).length
      const availableBeds = Math.max(capacity - activeResidents, 0)
      const occupancyPct = capacity ? (activeResidents / capacity) * 100 : 0

      return {
        house_id: h.id,
        house: h.name,
        totalBeds: capacity,
        activeResidents,
        availableBeds,
        occupancyPct: Number(occupancyPct.toFixed(1)),
        lastCensus: lastCensus.get(h.id) || null
      }
    })
  }, [filteredHouses, residents, censusSnapshots])

  // ─────────────────────────────────────────────
  // ROOMS CALCULATION (NEW)
  // ─────────────────────────────────────────────
  const totalRooms = rooms.length

  const roomsWithVacancies = useMemo(() => {
    // A room has vacancy if any bed tied to the room is unoccupied
    const roomGroups = new Map()
    for (const b of beds) {
      if (!roomGroups.has(b.room_id)) roomGroups.set(b.room_id, [])
      roomGroups.get(b.room_id).push(b)
    }

    let count = 0
    for (const r of rooms) {
      const roomBeds = roomGroups.get(r.id) || []
      const hasVacancy = roomBeds.some((b) => !b.occupied_by)
      if (hasVacancy) count++
    }
    return count
  }, [beds, rooms])

  // ─────────────────────────────────────────────
  // CHART DATA
  // ─────────────────────────────────────────────
  const chartData = useMemo(() =>
    byHouse.map((row) => ({
      house: row.house,
      activeResidents: row.activeResidents,
      availableBeds: row.availableBeds
    })),
    [byHouse]
  )

  // ─────────────────────────────────────────────
  // DASHBOARD METRICS
  // ─────────────────────────────────────────────
  const totalActiveResidents = residents.length
  const openMaintenanceCount = maintenance.length
  const lastUpdated = new Date().toLocaleString()

  // ─────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────
  if (loading) return <div className="p-6 text-gray-600">Loading dashboard…</div>

  return (
    <div className="space-y-6">

      {/* SUMMARY CARDS */}
      <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Tile title="Active Residents" value={totalActiveResidents} />

        {/* NEW ROOMS CARD */}
        <Tile
          title="Rooms (Vacant / Total)"
          value={`${roomsWithVacancies} / ${totalRooms}`}
        />

        <Tile title="Open Maintenance" value={openMaintenanceCount} emphasis="danger" />
        <Tile title="Last Updated" value={lastUpdated} mono />
      </section>

      {/* CHART */}
      <section className="rounded-2xl border bg-white p-5 shadow-md">
        <h2 className="text-lg font-semibold mb-2">Capacity vs. Utilization</h2>
        <p className="text-gray-600 text-sm mb-4">
          Blue: Active Residents • Green: Available Beds
        </p>

        <div className="h-[360px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
              <XAxis dataKey="house" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Legend />

              <Bar dataKey="activeResidents" fill="#3b82f6" radius={[6, 6, 0, 0]} />
              <Bar dataKey="availableBeds" fill="#22c55e" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* CENSUS TABLE */}
      <section className="rounded-xl border bg-white p-4 shadow-sm">
        <h2 className="text-lg font-semibold mb-2">Census Overview</h2>

        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-gray-600">
              <th className="px-3 py-2">House</th>
              <th className="px-3 py-2">Total Beds</th>
              <th className="px-3 py-2">Active</th>
              <th className="px-3 py-2">Available</th>
              <th className="px-3 py-2">Occupancy %</th>
              <th className="px-3 py-2">Last Census</th>
            </tr>
          </thead>

          <tbody>
            {byHouse.map((row) => (
              <tr key={row.house_id} className="border-t">
                <td className="px-3 py-2">{row.house}</td>
                <td className="px-3 py-2">{row.totalBeds}</td>
                <td className="px-3 py-2">{row.activeResidents}</td>
                <td className="px-3 py-2">{row.availableBeds}</td>

                <td className="px-3 py-2">
                  <span
                    className={`px-2 py-0.5 rounded ${
                      row.occupancyPct >= 85
                        ? 'bg-red-100 text-red-700'
                        : row.occupancyPct >= 50
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-green-100 text-green-700'
                    }`}
                  >
                    {row.occupancyPct}%
                  </span>
                </td>

                <td className="px-3 py-2">
                  {row.lastCensus ? new Date(row.lastCensus).toLocaleDateString() : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* SHIFT TURNOVER */}
      <section className="rounded-xl border bg-white p-4 shadow-sm">
        <div className="flex justify-between mb-2">
          <h2 className="text-lg font-semibold">Recent Shift Turnover</h2>
          <Link href="/dashboard/turnover" className="text-blue-600 text-sm">View →</Link>
        </div>

        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-gray-600">
              <th className="px-3 py-2">Shift</th>
              <th className="px-3 py-2">Notes</th>
              <th className="px-3 py-2">Submitted</th>
              <th className="px-3 py-2">When</th>
            </tr>
          </thead>

          <tbody>
            {turnover.map((t) => (
              <tr key={t.id} className="border-t">
                <td className="px-3 py-2">{t.shift_name}</td>
                <td className="px-3 py-2">{t.handover_notes}</td>
                <td className="px-3 py-2">{t.submitted_by}</td>
                <td className="px-3 py-2">{new Date(t.created_at).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  )
}

// ─────────────────────────────────────────────
// TILE COMPONENT
// ─────────────────────────────────────────────
function Tile({ title, value, emphasis, mono }) {
  const tone = emphasis === 'danger'
    ? 'bg-red-50 text-red-700'
    : 'bg-white text-gray-900'

  return (
    <div className={`rounded-xl border p-4 shadow-sm ${tone}`}>
      <div className="text-sm text-gray-600">{title}</div>
      <div className={`mt-1 text-2xl font-semibold ${mono ? 'font-mono' : ''}`}>
        {value}
      </div>
    </div>
  )
}
