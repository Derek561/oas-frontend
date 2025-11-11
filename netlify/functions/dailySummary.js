import fetch from "node-fetch";
import { Resend } from "resend";
import { createClient } from "@supabase/supabase-js";

// Initialize Resend + Supabase
const resend = new Resend(process.env.RESEND_API_KEY);
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export const handler = async (event, context) => {
  try {
    // Fetch 24-hour census and observation snapshot
    const { data: censusData, error: censusError } = await supabase
      .from("vw_room_occupancy")
      .select("*");

    const { data: obsData, error: obsError } = await supabase
      .from("observation_notes")
      .select("*")
      .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    if (censusError || obsError) {
      throw new Error("Supabase query failed");
    }

    // Calculate stats
    const totalBeds = censusData.reduce((sum, row) => sum + (row.capacity || 0), 0);
    const occupiedBeds = censusData.reduce((sum, row) => sum + (row.active_residents || 0), 0);
    const availableBeds = totalBeds - occupiedBeds;
    const occupancyRate = totalBeds > 0 ? ((occupiedBeds / totalBeds) * 100).toFixed(1) : 0;
    const obsCount = obsData.length;

    // Build email HTML
    const html = `
      <h2>Oceanside Housing 🏠 – Executive Summary (Last 24 Hours)</h2>
      <p><strong>Census Snapshot</strong></p>
      <ul>
        <li>Total Beds: ${totalBeds}</li>
        <li>Occupied: ${occupiedBeds}</li>
        <li>Available: ${availableBeds}</li>
        <li>Occupancy Rate: ${occupancyRate}%</li>
      </ul>
      <p><strong>Observation Notes Logged (24 hrs):</strong> ${obsCount}</p>
      <hr />
      <p style="font-size:12px;color:#666;">
        Report generated automatically by Oceanside Housing System on ${new Date().toLocaleString("en-US", { timeZone: "America/New_York" })}.
      </p>
    `;

    // Send email
    await resend.emails.send({
      from: "Oceanside Housing Reports <reports@oceansidehousing.llc>",
      to: ["derek@oceansidehousing.llc"],
      subject: `Executive Summary – ${new Date().toLocaleDateString("en-US")}`,
      html,
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ ok: true, sent: true }),
    };
  } catch (error) {
    console.error("Error running daily summary:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
