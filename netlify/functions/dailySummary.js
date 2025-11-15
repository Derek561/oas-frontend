// netlify/functions/dailySummary.js
import { createClient } from '@supabase/supabase-js'

export async function handler(event, context) {
  console.log("Running DAILY SUMMARY (production)…")

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
    // 2. Census snapshot (vw_room_occupancy)
    // -------------------------------------------
    const { data: census, error: censusErr } = await supabase
      .from('vw_room_occupancy')
      .select('*')

    if (censusErr) throw censusErr

    const totalBeds = census.reduce((a, r) => a + (r.capacity || 0), 0)
    const occupied = census.reduce((a, r) => a + (r.active_residents || 0), 0)
    const available = totalBeds - occupied
    const pct = totalBeds ? ((occupied / totalBeds) * 100).toFixed(1) : '0.0'

    // -------------------------------------------
    // 3. Events in last 24h (admissions + discharges)
    // -------------------------------------------
    const { data: events, error: eventsErr } = await supabase
      .from('resident_events')
      .select(
        'id, resident_id, house_id, event_type, discharge_reason, notes, created_at'
      )
      .gte('created_at', last24)
      .in('event_type', ['admission', 'discharge'])

    if (eventsErr) throw eventsErr

    const admissions = events.filter(e => e.event_type === 'admission')
    const discharges = events.filter(e => e.event_type === 'discharge')

    // -------------------------------------------
    // 4. Observation notes in last 24h
    // -------------------------------------------
    const { data: notes, error: notesErr } = await supabase
      .from('observation_notes')
      .select('id, resident_id, note_text, shift_name, created_at')
      .gte('created_at', last24)

    if (notesErr) throw notesErr

    // -------------------------------------------
    // 5. Pull resident names for all involved IDs
    // -------------------------------------------
    const residentIdSet = new Set<string>()

    admissions.forEach(e => e.resident_id && residentIdSet.add(e.resident_id))
    discharges.forEach(e => e.resident_id && residentIdSet.add(e.resident_id))
    notes.forEach(n => n.resident_id && residentIdSet.add(n.resident_id))

    let residentMap = new Map<string, any>()

    if (residentIdSet.size > 0) {
      const { data: residents, error: resErr } = await supabase
        .from('residents')
        .select('id, first_name, last_name')
        .in('id', Array.from(residentIdSet))

      if (resErr) throw resErr

      residentMap = new Map(
        residents.map(r => [r.id, r])
      )
    }

    const getResidentName = (residentId?: string | null) => {
      if (!residentId) return 'Unknown Resident'
      const r = residentMap.get(residentId)
      if (!r) return `Resident (${residentId.slice(0, 8)})`
      const first = r.first_name || ''
      const last = r.last_name || ''
      const full = `${first} ${last}`.trim()
      return full || `Resident (${residentId.slice(0, 8)})`
    }

    const fmtDateTime = (iso: string | null) => {
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
    // 6. Format detail lines
    // -------------------------------------------
    const admissionsLines = admissions.map(ev => {
      const name = getResidentName(ev.resident_id)
      const ts = fmtDateTime(ev.created_at)
      return `${name} – admitted (${ts})`
    })

    const dischargesLines = discharges.map(ev => {
      const name = getResidentName(ev.resident_id)
      const reason = ev.discharge_reason || 'No reason recorded'
      const extraNote = ev.notes ? ` – ${ev.notes}` : ''
      const ts = fmtDateTime(ev.created_at)
      return `${name} – ${reason}${extraNote} (${ts})`
    })

    const notesLines = notes.map(n => {
      const name = getResidentName(n.resident_id)
      const ts = fmtDateTime(n.created_at)
      const shift = n.shift_name || 'Shift not recorded'
      return `${name} – "${n.note_text}" (${shift}, ${ts})`
    })

    const renderList = (lines: string[]) => {
      if (!lines || !lines.length) return '<p>None.</p>'
      return `<ul>${lines.map(l => `<li>${l}</li>`).join('')}</ul>`
    }

    // -------------------------------------------
    // 7. Build email HTML body
    // -------------------------------------------
    const htmlBody = `
      <h2>Oceanside Housing – Executive Summary (Past 24 Hours)</h2>

      <h3>Census Snapshot</h3>
      <ul>
        <li><strong>Total Beds:</strong> ${totalBeds}</li>
        <li><strong>Occupied:</strong> ${occupied}</li>
        <li><strong>Available:</strong> ${available}</li>
        <li><strong>Occupancy Rate:</strong> ${pct}%</li>
      </ul>

      <h3>Admissions (Past 24 Hours)</h3>
      ${admissionsLines.length === 0
        ? '<p>No admissions.</p>'
        : renderList(admissionsLines)
      }

      <h3>Discharges (Past 24 Hours)</h3>
      ${dischargesLines.length === 0
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
    // 8. Send email via Resend
    // -------------------------------------------
    const payload = {
      from: "Oceanside Housing Reports <reports@oceansidehousing.llc>",
      to: ["derek@oceansidehousing.llc"],   // we can add CCs later
      subject: `Oceanside Housing – Executive Summary (${now.toLocaleDateString('en-US')})`,
      html: htmlBody
    }

    console.log("Resend payload (meta only):", {
      toCount: payload.to.length,
      subject: payload.subject,
    })

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const text = await response.text()
      console.error("Resend error:", response.status, text)
      throw new Error(`Resend failed with status ${response.status}`)
    }

    const result = await response.json()
    console.log("Resend success:", result)

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true })
    }

  } catch (err: any) {
    console.error("Daily Summary Error:", err)
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
