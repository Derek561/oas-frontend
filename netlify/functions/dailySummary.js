import { Resend } from "resend";
import { createClient } from "@supabase/supabase-js";

// Initialize Resend + Supabase
const resend = new Resend(process.env.RESEND_API_KEY);

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export const handler = async () => {
  try {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    // ------------------------------
    // 1. CENSUS SNAPSHOT
    // ------------------------------
    const { data: rooms, error: roomsErr } = await supabase
      .from("rooms")
      .select("capacity");

    if (roomsErr) throw roomsErr;

    const { data: residents, error: residentsErr } = await supabase
      .from("residents")
      .select("id")
      .eq("is_active", true);

    if (residentsErr) throw residentsErr;

    const totalBeds = rooms.reduce((sum, r) => sum + (r.capacity || 0), 0);
    const activeResidents = residents.length;
    const occupancyRate =
      totalBeds > 0 ? ((activeResidents / totalBeds) * 100).toFixed(1) : "0";

    // ------------------------------
    // 2. ADMISSIONS (Past 24 Hours)
    // ------------------------------
    const { data: admissions, error: admErr } = await supabase
      .from("resident_events")
      .select(
        `
        created_at,
        event_type,
        residents ( first_name, last_name ),
        houses ( name )
      `
      )
      .eq("event_type", "admission")
      .gte("created_at", since);

    if (admErr) throw admErr;

    const formattedAdmissions = admissions.map((a) => {
      const name = `${a.residents.first_name} ${a.residents.last_name}`;
      const house = a.houses?.name || "";
      return `${name} (${house})`;
    });

    // ------------------------------
    // 3. DISCHARGES (Past 24 Hours)
    // ------------------------------
    const { data: discharges, error: disErr } = await supabase
      .from("resident_events")
      .select(
        `
        created_at,
        event_type,
        residents ( first_name, last_name ),
        houses ( name )
      `
      )
      .eq("event_type", "discharge")
      .gte("created_at", since);

    if (disErr) throw disErr;

    const formattedDischarges = discharges.map((d) => {
      const name = `${d.residents.first_name} ${d.residents.last_name}`;
      const house = d.houses?.name || "";
      return `${name} (${house})`;
    });

    // ------------------------------
    // 4. OBSERVATION NOTE COUNT
    // ------------------------------
    const { data: notes, error: notesErr } = await supabase
      .from("observation_notes")
      .select("id")
      .gte("created_at", since);

    if (notesErr) throw notesErr;

    const obsCount = notes.length;

    // ------------------------------
    // 5. BUILD EMAIL HTML
    // ------------------------------
    const html = `
      <h2>Oceanside Housing – Executive Summary (Past 24 Hours)</h2>

      <h3>Census Snapshot</h3>
      <ul>
        <li><strong>Total Beds:</strong> ${totalBeds}</li>
        <li><strong>Occupied:</strong> ${activeResidents}</li>
        <li><strong>Available:</strong> ${totalBeds - activeResidents}</li>
        <li><strong>Occupancy Rate:</strong> ${occupancyRate}%</li>
      </ul>

      <h3>Admissions (Past 24 Hours)</h3>
      ${
        formattedAdmissions.length
          ? `<ul>${formattedAdmissions.map((i) => `<li>${i}</li>`).join("")}</ul>`
          : "<p>No admissions.</p>"
      }

      <h3>Discharges (Past 24 Hours)</h3>
      ${
        formattedDischarges.length
          ? `<ul>${formattedDischarges.map((i) => `<li>${i}</li>`).join("")}</ul>`
          : "<p>No discharges.</p>"
      }

      <h3>Observation Notes Logged:</h3>
      <p><strong>${obsCount}</strong> notes in the past 24 hours.</p>

      <hr />
      <p style="font-size:12px;color:#666;">
        Report generated automatically on 
        ${new Date().toLocaleString("en-US", { timeZone: "America/New_York" })}.
      </p>
    `;

    // ------------------------------
    // 6. SEND EMAIL
    // ------------------------------
    await resend.emails.send({
      from: "Oceanside Housing Reports <reports@oceansidehousing.llc>",
      to: ["derek@oceansidehousing.llc"],
      subject: `Executive Summary – ${new Date().toLocaleDateString("en-US")}`,
      html,
    });

    return { statusCode: 200, body: JSON.stringify({ ok: true, sent: true }) };
  } catch (err) {
    console.error("Daily Summary Error:", err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
