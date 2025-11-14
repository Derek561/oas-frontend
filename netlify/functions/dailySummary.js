import { Resend } from "resend";
import { createClient } from "@supabase/supabase-js";

const resend = new Resend(process.env.RESEND_API_KEY);

// ------------------------------
// SUPABASE CLIENT (Service Key)
// ------------------------------
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

export const handler = async (event, context) => {
  try {
    // TIME WINDOW: Last 24 Hours
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    // ------------------------------
    // 1. CURRENT CENSUS (Live Count)
    //    Match HousingCensusPage logic
    // ------------------------------
    const { data: censusRows, error: censusError } = await supabase
      .from("vw_room_occupancy")
      .select("*");

    if (censusError) throw censusError;

    const totalBeds = censusRows.reduce(
      (sum, r) => sum + (r.capacity || 0),
      0
    );
    const occupiedBeds = censusRows.reduce(
      (sum, r) => sum + (r.active_residents || 0),
      0
    );
    const availableBeds = censusRows.reduce(
      (sum, r) => sum + (r.open_beds || 0),
      0
    );
    const occupancyRate = totalBeds
      ? ((occupiedBeds / totalBeds) * 100).toFixed(1)
      : "0.0";

    // ------------------------------
    // 2. ADMISSIONS (Past 24 Hours)
    //    Include client names + house
    // ------------------------------
    const { data: admissionRows, error: admissionsError } = await supabase
      .from("resident_events")
      .select("id, event_type, created_at, resident_name, house_name")
      .eq("event_type", "admission")
      .gte("created_at", since)
      .order("created_at", { ascending: true });

    if (admissionsError) throw admissionsError;

    // ------------------------------
    // 3. DISCHARGES (Past 24 Hours)
    //    Include client names + house
    // ------------------------------
    const { data: dischargeRows, error: dischargesError } = await supabase
      .from("resident_events")
      .select("id, event_type, created_at, resident_name, house_name")
      .eq("event_type", "discharge")
      .gte("created_at", since)
      .order("created_at", { ascending: true });

    if (dischargesError) throw dischargesError;

    // ------------------------------
    // 4. OBSERVATION NOTES (Past 24 Hours)
    //    Full text, not just count
    // ------------------------------
    const { data: noteRows, error: notesError } = await supabase
      .from("observation_notes")
      .select("id, created_at, house_name, note_text, entered_by")
      .gte("created_at", since)
      .order("created_at", { ascending: true });

    if (notesError) throw notesError;

    // ------------------------------
    // 5. FORMAT SECTIONS
    // ------------------------------
    const fmtDateTime = (iso) =>
      iso ? new Date(iso).toLocaleString() : "";

    const admissionsHtml =
      admissionRows.length === 0
        ? "<p>No admissions in the past 24 hours.</p>"
        : `<ul>${admissionRows
            .map((row) => {
              const name = row.resident_name || "Unknown client";
              const house = row.house_name ? ` (${row.house_name})` : "";
              return `<li>${fmtDateTime(row.created_at)} – <strong>${name}</strong>${house}</li>`;
            })
            .join("")}</ul>`;

    const dischargesHtml =
      dischargeRows.length === 0
        ? "<p>No discharges in the past 24 hours.</p>"
        : `<ul>${dischargeRows
            .map((row) => {
              const name = row.resident_name || "Unknown client";
              const house = row.house_name ? ` (${row.house_name})` : "";
              return `<li>${fmtDateTime(row.created_at)} – <strong>${name}</strong>${house}</li>`;
            })
            .join("")}</ul>`;

    const notesHtml =
      noteRows.length === 0
        ? "<p>No observation notes logged in the past 24 hours.</p>"
        : `<ul>${noteRows
            .map((row) => {
              const house = row.house_name ? `[${row.house_name}] ` : "";
              const staff = row.entered_by ? `${row.entered_by}: ` : "";
              const text = row.note_text || "";
              return `<li>${fmtDateTime(row.created_at)} – ${house}${staff}${text}</li>`;
            })
            .join("")}</ul>`;

    // ------------------------------
    // 6. FINAL EMAIL HTML
    // ------------------------------
    const htmlContent = `
      <h2>Oceanside Housing – Executive Summary (Past 24 Hours)</h2>

      <h3>Census Snapshot</h3>
      <ul>
        <li><strong>Total Beds:</strong> ${totalBeds}</li>
        <li><strong>Occupied:</strong> ${occupiedBeds}</li>
        <li><strong>Available:</strong> ${availableBeds}</li>
        <li><strong>Occupancy Rate:</strong> ${occupancyRate}%</li>
      </ul>

      <h3>Admissions (Past 24 Hours)</h3>
      ${admissionsHtml}

      <h3>Discharges (Past 24 Hours)</h3>
      ${dischargesHtml}

      <h3>Observation Notes (Past 24 Hours)</h3>
      ${notesHtml}

      <p style="font-size:12px;color:#999;">
        Report generated automatically on ${new Date().toLocaleString()}.
      </p>
    `;

    // ------------------------------
    // 7. SEND EMAIL
    // ------------------------------
    const emailResult = await resend.emails.send({
      from: "Oceanside Housing Reports <reports@oceansidehousing.llc>",
      to: ["derek@simplepathrecovery.net"],
      subject: "Oceanside Housing – Executive Summary (Past 24 Hours)",
      html: htmlContent,
    });

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Daily summary sent successfully",
        details: emailResult,
      }),
    };
  } catch (err) {
    console.error("Daily Summary Error:", err);

    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
