import { NextResponse } from "next/server";
import { Resend } from "resend";
import { createClient } from "@supabase/supabase-js";

const resend = new Resend(process.env.RESEND_API_KEY);

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export async function GET() {
  try {
    // --- Fetch live Census + Observations snapshot (past 24 hrs)
    const { data, error } = await supabase
      .from("vw_room_occupancy")
      .select("*");
    if (error) throw error;

    const { data: obs } = await supabase
      .from("observation_notes")
      .select("id, house_id, created_at")
      .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    // --- Compute totals
    const totalBeds = data.reduce((a, r) => a + (r.capacity || 0), 0);
    const occupied = data.reduce((a, r) => a + (r.active_residents || 0), 0);
    const available = totalBeds - occupied;
    const occPct = totalBeds ? ((occupied / totalBeds) * 100).toFixed(1) : "0.0";
    const obsCount = obs?.length || 0;

    // --- Format email HTML
    const html = `
      <h2>Oceanside Housing – Executive Summary (Last 24 Hours)</h2>
      <p><strong>Census Snapshot</strong><br/>
      Total Beds: ${totalBeds}<br/>
      Occupied: ${occupied}<br/>
      Available: ${available}<br/>
      Occupancy Rate: ${occPct}%</p>
      <p><strong>Observation Notes Logged (24 hrs):</strong> ${obsCount}</p>
      <hr/>
      <p style="font-size:12px;color:#666;">
        Report generated automatically by Oceanside Housing System at ${new Date().toLocaleString()}.
      </p>
    `;

    // --- Send Email via Resend
    await resend.emails.send({
      from: "Oceanside Housing Reports <reports@oceansidehousing.llc>",
      to: ["derek@oceansidehousing.llc"],
      subject: `Executive Summary – ${new Date().toLocaleDateString()}`,
      html,
    });

    return NextResponse.json({ ok: true, sent: true });
  } catch (err) {
    console.error("Resend Email Error:", err);
    return NextResponse.json({ ok: false, error: err.message });
  }
}
