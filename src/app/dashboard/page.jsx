'use client'

/**
 * Oceanside Housing – Operations Dashboard (Stable Build v2.1)
 * --------------------------------------------------------------
 * - Fixed occupancy logic using static capacities
 * - Added chartData redefinition
 * - Includes Census + Shift Turnover live data
 * - Ready for Git push as stable baseline
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

export default function OperationsHome() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [houses, setHouses] = useState([])
  const [beds, setBeds] = useState([])
  const [residents, setResidents] = useState([])
  const [censusSnapshots, setCensusSnapshots] = useState([])
  const [turnover, setTurnover] = useState([])
  const [maintenance, setMaintenance] = useState([])

  useEffect(() => {
    let isMounted = true

    async function load() {
      setLoading(true)
      setError(null)
      try {
        const [
          { data: houseRows, error: houseErr },
          { data: bedRows, error: bedErr },
          { data: residentRows, error: residentErr },
          { data: censusRows, error: censusErr },
          { data: turnoverRows, error: turnoverErr },
          { data: maintenanceRows, error: maintenanceErr },
        ] = await Promise.all([
          supabase.from('houses').select('id, name').order('name', { ascending: true }),
          supabase.from('beds').select('id, house_id, occupied_by'),
          supabase.from('residents').select('id, house_id, status').eq('status', 'Active'),
          supabase.from('census_snapshots').select('house_id, created_at').order('created_at', { ascending: false }),
          supabase
            .from('shift_turnover')
            .select('id, shift_name, handover_notes, submitted_by, created_at')
            .order('created_at', { ascending: false })
            .limit(5),
          supabase
            .from('maintenance')
            .select('id, status')
            .in('status', ['Open', 'In Progress']),
        ])

        if (houseErr || bedErr || residentErr || censusErr || turnoverErr || maintenanceErr) {
          const errText =
            houseErr?.message ||
            bedErr?.message ||
            residentErr?.message ||
            censusErr?.message ||
            turnoverErr?.message ||
            maintenanceErr?.message ||
            'Unknown error'
          throw new Error(errText)
        }

        if (!isMounted) return
        setHouses(houseRows || [])
        setBeds(bedRows || [])
        setResidents(residentRows || [])
        setCensusSnapshots(censusRows || [])
        setTurnover(turnoverRows || [])
        setMaintenance(maintenanceRows || [])
      } catch (e) {
        console.error('Dashboard load error:', e)
        if (isMounted) setError(e.message || 'Failed to load dashboard data.')
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    load()
    return () => {
      isMounted = false
    }
  }, [])

  // ─────────────────────────────────────────────
// Aggregations for chart + table (corrected with static capacities + normalization)
// ─────────────────────────────────────────────
const byHouse = useMemo(() => {
  const lastCensusMap = new Map()
  for (const snap of censusSnapshots) {
    const ts = snap.created_at || null
    if (!lastCensusMap.has(snap.house_id)) lastCensusMap.set(snap.house_id, ts)
  }

  // ✅ Fixed static capacity map + normalized keys
  const houseCapacities = {
    'blue building': 11,
    'oceanside house b': 10,
    'oceanside house a': 18,
  }

  return houses.map((h) => {
    const key = h.name.trim().toLowerCase()
    const capacity = houseCapacities[key] || 0
    const activeResidents = residents.filter((r) => r.house_id === h.id).length
    const availableBeds = Math.max(capacity - activeResidents, 0)
    const occupancyPct = capacity ? (100 * activeResidents) / capacity : 0

    return {
      house_id: h.id,
      house: h.name,
      totalBeds: capacity,
      activeResidents,
      availableBeds,
      occupancyPct: Number(occupancyPct.toFixed(1)),
      lastCensus: lastCensusMap.get(h.id) || null,
    }
  })
}, [houses, residents, censusSnapshots])

  // ─────────────────────────────────────────────
  // Chart Data (for BarChart)
  // ─────────────────────────────────────────────
  const chartData = useMemo(
    () =>
      byHouse.map((row) => ({
        house: row.house,
        activeResidents: row.activeResidents,
        availableBeds: row.availableBeds,
      })),
    [byHouse]
  )

  // ─────────────────────────────────────────────
  // Top-level metrics
  // ─────────────────────────────────────────────
  const lastUpdated = useMemo(() => new Date().toLocaleString(), [loading, byHouse.length, turnover.length])
  const totalActiveResidents = useMemo(() => residents.length, [residents])
  const totalRooms = 14 // static; can be dynamic later
  const openMaintenanceCount = useMemo(() => maintenance.length, [maintenance])

  // ─────────────────────────────────────────────
  // UI Rendering
  // ─────────────────────────────────────────────
  if (loading)
    return <div className="p-6 text-sm text-gray-600">Loading Operations Dashboard…</div>

  if (error)
    return (
      <div className="p-6">
        <div className="rounded-md border border-red-300 bg-red-50 p-4 text-red-700">
          Failed to load: {error}
        </div>
      </div>
    )

  return (
    <div className="space-y-6">
      {/* ─────────────── Summary Tiles ─────────────── */}
      <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Tile title="Active Residents" value={totalActiveResidents} />
        <Tile title="Rooms" value={totalRooms} />
        <Tile title="Open Maintenance" value={openMaintenanceCount} emphasis="danger" />
        <Tile title="Last Updated" value={lastUpdated} mono />
      </section>

      {/* ─────────────── Census Chart (v2.2 visual) ─────────────── */}
<section className="rounded-2xl border bg-white p-5 shadow-md">
  <h2 className="mb-2 text-lg font-semibold text-gray-800">
    Capacity vs. Utilization
  </h2>
  <p className="mb-4 text-sm text-gray-600">
    Blue: Active Residents &nbsp;•&nbsp; Green: Available Beds
  </p>

  <div className="h-[380px] w-full">
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={chartData} margin={{ top: 8, right: 24, left: 0, bottom: 8 }}>
        <defs>
          {/* Blue gradient */}
          <linearGradient id="colorActive" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.95} />
            <stop offset="95%" stopColor="#60a5fa" stopOpacity={0.55} />
          </linearGradient>

          {/* Green gradient */}
          <linearGradient id="colorAvailable" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#22c55e" stopOpacity={0.9} />
            <stop offset="95%" stopColor="#4ade80" stopOpacity={0.5} />
          </linearGradient>
        </defs>

        <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
        <XAxis
          dataKey="house"
          tick={{ fontSize: 13, fill: '#374151' }}
          tickLine={false}
        />
        <YAxis
          allowDecimals={false}
          tick={{ fontSize: 12, fill: '#4b5563' }}
          axisLine={false}
        />
        <Tooltip
          contentStyle={{
            borderRadius: '10px',
            backgroundColor: '#ffffffee',
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
          }}
          cursor={{ fill: '#f9fafb' }}
        />
        <Legend wrapperStyle={{ fontSize: '13px' }} />
        <Bar
          dataKey="activeResidents"
          name="Active Residents"
          fill="url(#colorActive)"
          radius={[8, 8, 0, 0]}
        />
        <Bar
          dataKey="availableBeds"
          name="Available Beds"
          fill="url(#colorAvailable)"
          radius={[8, 8, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  </div>
</section>

      {/* ─────────────── Census Table ─────────────── */}
      <section className="rounded-xl border bg-white p-4 shadow-sm">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Census Overview</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-gray-600">
                <th className="px-3 py-2">House</th>
                <th className="px-3 py-2">Total Beds</th>
                <th className="px-3 py-2">Active Residents</th>
                <th className="px-3 py-2">Available Beds</th>
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
                      className={`rounded px-2 py-0.5 ${
                        row.occupancyPct >= 85
                          ? 'bg-red-50 text-red-700'
                          : row.occupancyPct >= 50
                          ? 'bg-yellow-50 text-yellow-700'
                          : 'bg-green-50 text-green-700'
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
        </div>
      </section>

      {/* ─────────────── Recent Shift Turnover ─────────────── */}
      <section className="rounded-xl border bg-white p-4 shadow-sm">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Recent Shift Turnover</h2>
          <Link href="/dashboard/turnover" className="text-sm text-blue-600 hover:underline">
            View Shift Turnover →
          </Link>
        </div>
        {turnover.length === 0 ? (
          <div className="rounded-md border border-dashed p-4 text-sm text-gray-600">
            No recent turnover entries.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-gray-600">
                  <th className="px-3 py-2">Shift</th>
                  <th className="px-3 py-2">Handover Notes</th>
                  <th className="px-3 py-2">Submitted By</th>
                  <th className="px-3 py-2">Created</th>
                </tr>
              </thead>
              <tbody>
                {turnover.map((t) => (
                  <tr key={t.id} className="border-t">
                    <td className="px-3 py-2">{t.shift_name || '—'}</td>
                    <td className="px-3 py-2">{t.handover_notes || '—'}</td>
                    <td className="px-3 py-2">{t.submitted_by || '—'}</td>
                    <td className="px-3 py-2">
                      {t.created_at ? new Date(t.created_at).toLocaleString() : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}

/** Small reusable tile component */
function Tile({ title, value, emphasis, mono }) {
  const tone =
    emphasis === 'danger' ? 'bg-red-50 text-red-700' : 'bg-white text-gray-900'

  return (
    <div className={`rounded-xl border p-4 shadow-sm ${tone}`}>
      <div className="text-sm text-gray-600">{title}</div>
      <div className={`mt-1 text-2xl font-semibold ${mono ? 'font-mono' : ''}`}>
        {value}
      </div>
    </div>
  )
}