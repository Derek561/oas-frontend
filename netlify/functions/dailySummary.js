// netlify/functions/dailySummary.js
const { createClient } = require('@supabase/supabase-js')

exports.handler = async function (event, context) {
  console.log('Running DAILY SUMMARY (production)…')

  try {
    // -------------------------------------------
    // 1. Supabase client
    // -------------------------------------------
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )

    const now = new Date()
    const last24 = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString()

    // -------------------------------------------
    // 2. House nickname + icon map
    //    (REPLACE the UUID placeholders with
    //     the real IDs from public.houses)
    // -------------------------------------------
    const HOUSE_NICKNAMES = {
      // Oceanside House A – "8th Court"
      '49cf4cfa-e783-4932-b14d-fa1be226111f': { label: '8th Court', icon: '🟡' },

      // Oceanside House B – "626"
      '308bb7cb-90f0-4e83-9d10-1c5b92c2bf0d': { label: '626', icon: '🟣' },

      // Blue Building – "Blue Building"
      '80ae39a3-be84-47e8-bada-6c59c466bbef': { label: 'Blue Building', icon: '🔵' }
    }

    function getHouseInfo(houseId) {
      if (!houseId) {
        return { label: 'Unknown House', icon: '⚪' }
      }
      return (
        HOUSE_NICKNAMES[houseId] || {
          label: 'Unknown House',
          icon: '⚪'
        }
      )
    }

    // -------------------------------------------
    // 3. Census snapshot (vw_room_occupancy)
    // -------------------------------------------
    const { data: census, error: censusErr } = await supabase
      .from('vw_room_occupancy')
      .select('*')

    if (censusErr) throw censusErr

    const safeCensus = census || []

    const totalBeds = safeCensus.reduce((a, r) => a + (r.capacity || 0), 0)
    const occupied = safeCensus.reduce(
      (a, r) => a + (r.active_residents || 0),
      0
    )
    const available = totalBeds - occupied
    const pct =
      totalBeds > 0 ? ((occupied / totalBeds) * 100).toFixed(1) : '0.0'

    // Per-house buckets for the pretty list
    const houseBuckets = {}
    for (const row of safeCensus) {
      const key = row.house_id || 'unknown'
      if (!houseBuckets[key]) {
        houseBuckets[key] = { beds: 0, occupied: 0 }
      }
      houseBuckets[key].beds += row.capacity || 0
      houseBuckets[key].occupied += row.active_residents || 0
    }

    // -------------------------------------------
    // 4. Events in last 24h (admissions + discharges)
    //    NOTE: now includes ua_level, bac_level,
    //          and event_details.
    // -------------------------------------------
    const { data: events, error: eventsErr } = await supabase
      .from('resident_events')
      .select(
        'id, resident_id, house_id, event_type, ua_level, bac_level, event_details, discharge_reason, notes, created_at'
      )
      .gte('created_at', last24)
      .in('event_type', ['admission', 'discharge'])

    if (eventsErr) throw eventsErr

    const safeEvents = events || []
    const admissions = safeEvents.filter((e) => e.event_type === 'admission')
    const discharges = safeEvents.filter((e) => e.event_type === 'discharge')

    // -------------------------------------------
    // 5. Observation notes in last 24h
    // -------------------------------------------
    const { data: notes, error: notesErr } = await supabase
      .from('observation_notes')
      .select('id, resident_id, house_id, note_text, shift_name, created_at')
      .gte('created_at', last24)

    if (notesErr) throw notesErr

    const safeNotes = notes || []

    // -------------------------------------------
    // 6. Resident names lookup
    // -------------------------------------------
    const residentIds = new Set()

    admissions.forEach((e) => e.resident_id && residentIds.add(e.resident_id))
    discharges.forEach((e) => e.resident_id && residentIds.add(e.resident_id))
    safeNotes.forEach((n) => n.resident_id && residentIds.add(n.resident_id))

    let residentMap = new Map()

    if (residentIds.size > 0) {
      const { data: residents, error: resErr } = await supabase
        .from('residents')
        .select('id, first_name, last_name')
        .in('id', Array.from(residentIds))

      if (resErr) throw resErr

      residentMap = new Map(
        (residents || []).map((r) => [
          r.id,
          {
            name: `${r.first_name || ''} ${r.last_name || ''}`.trim()
          }
        ])
      )
    }

    function getResidentName(rid) {
      const r = residentMap.get(rid)
      if (!r) return 'Unknown Resident'
      return r.name || 'Unknown Resident'
    }

    function fmtDateTime(iso) {
      if (!iso) return ''
      try {
        return new Date(iso).toLocaleString('en-US', {
          timeZone: 'America/New_York'
        })
      } catch {
        return iso
      }
    }

    // -------------------------------------------
    // 7. Format lines
    // -------------------------------------------

    // Census – per-house bullets
    const censusLines = Object.entries(houseBuckets).map(
      ([houseId, stats]) => {
        const info = getHouseInfo(houseId === 'unknown' ? null : houseId)
        return `${info.icon} <strong>${info.label}:</strong> ${stats.occupied} / ${stats.beds}`
      }
    )

    function formatAdmission(ev) {
      const house = getHouseInfo(ev.house_id)
      const name = getResidentName(ev.resident_id)
      const ts = fmtDateTime(ev.created_at)

      const uaPart = ev.ua_level ? ` – UA: ${ev.ua_level}` : ''
      const bacPart = ev.bac_level ? ` – BAC: ${ev.bac_level}` : ''

      const detailSource = ev.event_details || ev.notes
      const detailPart = detailSource ? ` – ${detailSource}` : ''

      // (Unit/room intentionally NOT included yet:
      //  residents table does not expose a unit column to this function.)

      return `${house.icon} ${house.label} – ${name}${uaPart}${bacPart}${detailPart} (${ts})`
    }

    function formatDischarge(ev) {
      const house = getHouseInfo(ev.house_id)
      const name = getResidentName(ev.resident_id)
      const ts = fmtDateTime(ev.created_at)

      const reason = ev.discharge_reason || 'No reason recorded'
      const notesPart = ev.notes ? ` – ${ev.notes}` : ''

      return `${house.icon} ${house.label} – ${name} – ${reason}${notesPart} (${ts})`
    }

    function formatNote(n) {
      const house = getHouseInfo(n.house_id)
      const name = getResidentName(n.resident_id)
      const ts = fmtDateTime(n.created_at)
      const shift = n.shift_name || 'Shift not recorded'
      const text = n.note_text || ''

      return `${house.icon} ${house.label} – ${name} – "${text}" (${shift}, ${ts})`
    }

    const admissionsLines = admissions.map(formatAdmission)
    const dischargesLines = discharges.map(formatDischarge)
    const notesLines = safeNotes.map(formatNote)

    function renderList(lines) {
      if (!lines || !lines.length) return '<p>None.</p>'
      return `<ul>${lines.map((l) => `<li>${l}</li>`).join('')}</ul>`
    }

    // -------------------------------------------
    // 8. Build HTML body
    // -------------------------------------------
    const htmlBody = `
      <h2>Oceanside Housing – Executive Summary (Past 24 Hours)</h2>

      <h3>Census Snapshot</h3>
      <ul>
        ${censusLines.map((l) => `<li>${l}</li>`).join('')}
      </ul>

      <p><strong>Total Beds:</strong> ${totalBeds}</p>
      <p><strong>Occupied:</strong> ${occupied}</p>
      <p><strong>Available:</strong> ${available}</p>
      <p><strong>Occupancy Rate:</strong> ${pct}%</p>

      <h3>Admissions (Past 24 Hours)</h3>
      ${
        admissionsLines.length === 0
          ? '<p>No admissions.</p>'
          : renderList(admissionsLines)
      }

      <h3>Discharges (Past 24 Hours)</h3>
      ${
        dischargesLines.length === 0
          ? '<p>No discharges.</p>'
          : renderList(dischargesLines)
      }

      <h3>Observation Notes Logged</h3>
      <p><strong>Total notes:</strong> ${notesLines.length}</p>
      ${notesLines.length === 0 ? '' : renderList(notesLines)}

      <p style="margin-top:20px;font-size:12px;color:#777;">
        Report generated automatically on ${now.toLocaleString('en-US', {
          timeZone: 'America/New_York'
        })}.
      </p>
    `

    // -------------------------------------------
    // 9. Send email via Resend
    // -------------------------------------------
    const payload = {
      from: 'Oceanside Housing Reports <reports@oceansidehousing.llc>',
      to: [
        'derek@oceansidehousing.llc',
        'ocean1@oceansidehousing.llc',
        'ocean2@oceansidehousing.llc',
        'derek@simplepathrecovery.net',
        'heidi@simplepathrecovery.net',
        'matt@simplepathrecovery.net',
        'cathy@simplepathrecovery.net',
        'dom@simplepathrecovery.net',
        'drew@simplepathrecovery.net',
        'jacquelyn@simplepathrecovery.net',
        'iris@simplepathrecovery.net',
        'paul@simplepathrecovery.net',
        'laurie@simplepathrecovery.net',
        'amy@simplepathrecovery.net'
      ],
      subject: `Oceanside Housing – Executive Summary (${now.toLocaleDateString(
        'en-US'
      )})`,
      html: htmlBody
    }

    console.log('Resend payload (meta only):', {
      toCount: payload.to.length,
      subject: payload.subject
    })

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    })

    if (!response.ok) {
      const text = await response.text()
      console.error('Resend error:', response.status, text)
      throw new Error(`Resend failed with status ${response.status}`)
    }

    const result = await response.json()
    console.log('Resend success:', result)

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true })
    }
  } catch (err) {
    console.error('Daily Summary Error:', err)
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        message: err.message,
        code: err.code || null
      })
    }
  }
}
