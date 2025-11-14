import { Resend } from "resend";
import { createClient } from "@supabase/supabase-js";

const resend = new Resend(process.env.RESEND_API_KEY);

// ------------------------------
//  SUPABASE CLIENT (Service Key)
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
const censusQuery = await supabase
  .from("vw_room_occupancy")
  .select("*");

if (censusQuery.error) throw censusQuery.error;

const censusRows = censusQuery.data || [];

// Sum beds exactly like the frontend HousingCensusPage
const totalBeds = censusRows.reduce((sum, r) => sum + (r.capacity || 0), 0);
const occupiedBeds = censusRows.reduce((sum, r) => sum + (r.active_residents || 0), 0);

// Prefer explicit open_beds if present, otherwise fall back to total - occupied
const calculatedAvailable = censusRows.reduce(
  (sum, r) => sum + (r.open_beds || 0),
  0
);
const availableBeds =
  calculatedAvailable > 0 ? calculatedAvailable : totalBeds - occupiedBeds;

const occupancyRate =
  totalBeds > 0 ? ((occupiedBeds / totalBeds) * 100).toFixed(1) : "0.0";

    // ------------------------------
    // 2. ADMISSIONS (Past 24 Hours)
    // ------------------------------
    const admissionsQuery = await supabase
      .from("resident_events")
      .select("*", { count: "exact", head: true })
      .eq("event_type", "admission")
      .gte("created_at", since);

    const admissions24 = admissionsQuery.count ?? 0;

    // ------------------------------
    // 3. DISCHARGES (Past 24 Hours)
    // ------------------------------
    const dischargesQuery = await supabase
      .from("resident_events")
      .select("*", { count: "exact", head: true })
      .eq("event_type", "discharge")
      .gte("created_at", since);

    const discharges24 = dischargesQuery.count ?? 0;

    // ------------------------------
    // 4. OBSERVATION NOTES (Past 24 Hours)
    // ------------------------------
    const notesQuery = await supabase
      .from("observation_notes")
      .select("*", { count: "exact", head: true })
      .gte("created_at", since);

    const notes24 = notesQuery.count ?? 0;

    // ------------------------------
    //  FORMAT EMAIL
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
      <p>${admissions24 > 0 ? admissions24 : "No admissions."}</p>

      <h3>Discharges (Past 24 Hours)</h3>
      <p>${discharges24 > 0 ? discharges24 : "No discharges."}</p>

      <h3>Observation Notes Logged</h3>
      <p>${notes24} note(s) in the past 24 hours.</p>

      <p style="font-size:12px;color:#999;">
        Report generated automatically on ${new Date().toLocaleString()}.
      </p>
    `;

    // ------------------------------
    //  SEND EMAIL
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
