// netlify/functions/dailySummary.js

import { createClient } from '@supabase/supabase-js'

export async function handler(event, context) {
  console.log("Running dailySummary function…")

  try {
    // -------------------------------------------
    // 1. CONNECT TO SUPABASE
    // -------------------------------------------
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )

    const last24 = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

    // -------------------------------------------
    // 2. PULL CENSUS TOTALS
    // -------------------------------------------
    const { data: censusData, error: censusError } = await supabase
      .from('vw_room_occupancy')
      .select('*')

    if (censusError) throw censusError

    const totalBeds = censusData.reduce((a, r) => a + (r.capacity || 0), 0)
    const occupied = censusData.reduce((a, r) => a + (r.active_residents || 0), 0)
    const available = totalBeds - occupied
    const pct = totalBeds > 0 ? ((occupied / totalBeds) * 100).toFixed(1) : '0.0'

    // -------------------------------------------
    // 3. ADMISSIONS COUNT
    // -------------------------------------------
    const { count: admissionsCount, error: admErr } = await supabase
      .from('resident_events')
      .select('*', { count: 'exact', head: true })
      .eq('event_type', 'admission')
      .gte('created_at', last24)

    if (admErr) throw admErr

    // -------------------------------------------
    // 4. DISCHARGES COUNT
    // -------------------------------------------
    const { count: dischargesCount, error: disErr } = await supabase
      .from('resident_events')
      .select('*', { count: 'exact', head: true })
      .eq('event_type', 'discharge')
      .gte('created_at', last24)

    if (disErr) throw disErr

    // -------------------------------------------
    // 5. OBSERVATION NOTES COUNT
    // -------------------------------------------
    const { count: notesCount, error: noteErr } = await supabase
      .from('observation_notes')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', last24)

    if (noteErr) throw noteErr

    // -------------------------------------------
    // 6. BUILD EMAIL BODY (MATCHES YOUR WORKING FORMAT)
    // -------------------------------------------
    const htmlBody = `
      <h2>Oceanside Housing – Executive Summary (Past 24 Hours)</h2>

      <p><strong>Total Beds:</strong> ${totalBeds}</p>
      <p><strong>Occupied:</strong> ${occupied}</p>
      <p><strong>Available:</strong> ${available}</p>
      <p><strong>Occupancy Rate:</strong> ${pct}%</p>

      <h3>Admissions (Past 24 Hours)</h3>
      <p>${admissionsCount === 0 ? "No admissions." : admissionsCount}</p>

      <h3>Discharges (Past 24 Hours)</h3>
      <p>${dischargesCount === 0 ? "No discharges." : dischargesCount}</p>

      <h3>Observation Notes Logged</h3>
      <p>${notesCount} note(s) in the past 24 hours.</p>

      <br/><br/>
      <p style="font-size:12px;color:#777;">
        Report generated automatically on ${new Date().toLocaleString()}.
      </p>
    `

    // -------------------------------------------
    // 7. SEND EMAIL (RESEND API)
    // -------------------------------------------
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Oceanside Housing Reports <reports@oceansidehousing.llc>",
        to: ["derek@oceansidehousing.llc"],
        subject: `Oceanside Housing – Executive Summary (${new Date().toLocaleDateString()})`,
        html: htmlBody
      }),
    })

    const result = await response.json()
    console.log("Email sent:", result)

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, details: result })
    }

  } catch (err) {
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
