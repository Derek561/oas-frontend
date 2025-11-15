// netlify/functions/dailySummary.js
import { createClient } from '@supabase/supabase-js'

export async function handler(event, context) {
  console.log("Running DIAGNOSTIC dailySummary...")

  try {
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )

    const last24 = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

    // -------------------------------------------
    // CENSUS
    // -------------------------------------------
    const { data: census, error: censusErr } = await supabase
      .from('vw_room_occupancy')
      .select('*')

    if (censusErr) throw censusErr

    const totalBeds = census.reduce((a, r) => a + (r.capacity || 0), 0)
    const occupied = census.reduce((a, r) => a + (r.active_residents || 0), 0)
    const available = totalBeds - occupied
    const pct = totalBeds ? ((occupied / totalBeds) * 100).toFixed(1) : "0.0"

    // -------------------------------------------
    // ADMISSIONS (RETURN FULL ROWS)
    // -------------------------------------------
    const { data: admissions, error: admErr } = await supabase
      .from('resident_events')
      .select('*')
      .eq('event_type', 'admission')
      .gte('created_at', last24)

    if (admErr) throw admErr

    const admissionsCount = admissions?.length ?? null

    // -------------------------------------------
    // DISCHARGES
    // -------------------------------------------
    const { data: discharges, error: disErr } = await supabase
      .from('resident_events')
      .select('*')
      .eq('event_type', 'discharge')
      .gte('created_at', last24)

    if (disErr) throw disErr

    const dischargesCount = discharges?.length ?? null

    // -------------------------------------------
    // OBSERVATION NOTES
    // -------------------------------------------
    const { data: notes, error: noteErr } = await supabase
      .from('observation_notes')
      .select('*')
      .gte('created_at', last24)

    if (noteErr) throw noteErr

    const notesCount = notes?.length ?? null

    // -------------------------------------------
    // BUILD HTML BODY (but DO NOT send)
    // -------------------------------------------
    const htmlBody = `
      <h2>DIAGNOSTIC – Ocean Housing Summary</h2>

      <p>Total Beds: ${totalBeds}</p>
      <p>Occupied: ${occupied}</p>
      <p>Available: ${available}</p>
      <p>Pct: ${pct}</p>

      <p>AdmissionsCount: ${admissionsCount}</p>
      <p>DischargesCount: ${dischargesCount}</p>
      <p>NotesCount: ${notesCount}</p>
    `

    // -------------------------------------------
    // LOG EVERYTHING
    // -------------------------------------------
    console.log("=== DIAGNOSTIC OUTPUT ===")
    console.log({
      totalBeds,
      occupied,
      available,
      pct,
      admissions,
      admissionsCount,
      discharges,
      dischargesCount,
      notes,
      notesCount,
      htmlBody
    })

    return {
      statusCode: 200,
      body: JSON.stringify({
        diagnostic: true,
        totalBeds,
        occupied,
        available,
        pct,
        admissionsCount,
        dischargesCount,
        notesCount
      })
    }

  } catch (err) {
    console.error("DIAGNOSTIC ERROR:", err)
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: true,
        message: err.message,
        code: err.code || null
      })
    }
  }
}
