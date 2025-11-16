// netlify/functions/dailySummary.js
const { createClient } = require("@supabase/supabase-js");

exports.handler = async function (event, context) {
  console.log("Running DAILY SUMMARY (production)…");

  try {
    // ---------------------------------------------------------
    // 1. Initialize Supabase
    // ---------------------------------------------------------
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const now = new Date();
    const last24 = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();

    // ---------------------------------------------------------
    // 2. House nickname + icon map
    // ---------------------------------------------------------
    const HOUSE_NICKNAMES = {
      "308bb7cb-90f0-4e83-9d10-1c5b92c2bf0d": { label: "8th Court", icon: "🟢" },
      "80ae39a3-be84-47e8-bada-6c59c466bbef": { label: "626", icon: "🔵" },
      "PUT-BLUE-HOUSE-ID-HERE": { label: "Blue Building", icon: "🟣" }
    };

    function getHouseInfo(houseId) {
      return (
        HOUSE_NICKNAMES[houseId] || {
          label: "Unknown House",
          icon: "⚪",
        }
      );
    }

    // ---------------------------------------------------------
    // 3. Census snapshot
    // ---------------------------------------------------------
    const { data: census, error: censusErr } = await supabase
      .from("vw_room_occupancy")
      .select("*");

    if (censusErr) throw censusErr;

    const totalBeds = census.reduce((a, r) => a + (r.capacity || 0), 0);
    const occupied = census.reduce((a, r) => a + (r.active_residents || 0), 0);
    const available = totalBeds - occupied;
    const pct = totalBeds
      ? ((occupied / totalBeds) * 100).toFixed(1)
      : "0.0";

    // ---------------------------------------------------------
    // 4. Events (Admissions + Discharges)
    // ---------------------------------------------------------
    const { data: events, error: eventsErr } = await supabase
      .from("resident_events")
      .select(
        "id, resident_id, house_id, event_type, discharge_reason, notes, created_at"
      )
      .gte("created_at", last24)
      .in("event_type", ["admission", "discharge"]);

    if (eventsErr) throw eventsErr;

    const admissions = events.filter((e) => e.event_type === "admission");
    const discharges = events.filter((e) => e.event_type === "discharge");

    // ---------------------------------------------------------
    // 5. Observation Notes
    // ---------------------------------------------------------
    const { data: notes, error: notesErr } = await supabase
      .from("observation_notes")
      .select("id, resident_id, house_id, note_text, shift_name, created_at")
      .gte("created_at", last24);

    if (notesErr) throw notesErr;

    // ---------------------------------------------------------
    // 6. Collect resident IDs to fetch names
    // ---------------------------------------------------------
    const residentIds = new Set();

    admissions.forEach((e) => residentIds.add(e.resident_id));
    discharges.forEach((e) => residentIds.add(e.resident_id));
    notes.forEach((n) => residentIds.add(n.resident_id));

    let residentMap = new Map();

    if (residentIds.size > 0) {
      const { data: residents, error: rErr } = await supabase
        .from("residents")
        .select("id, first_name, last_name")
        .in("id", Array.from(residentIds));

      if (rErr) throw rErr;

      residentMap = new Map(
        residents.map((r) => [
          r.id,
          {
            name: `${r.first_name || ""} ${r.last_name || ""}`.trim(),
          },
        ])
      );
    }

    function getResident(rid) {
      return residentMap.get(rid) || { name: "Unknown" };
    }

    function fmtTimestamp(iso) {
      if (!iso) return "";
      try {
        return new Date(iso).toLocaleString("en-US", {
          timeZone: "America/New_York",
        });
      } catch {
        return iso;
      }
    }

    // ---------------------------------------------------------
    // 7. Formatting helpers
    // ---------------------------------------------------------
    const formatAdmission = (ev) => {
      const house = getHouseInfo(ev.house_id);
      const r = getResident(ev.resident_id);
      const ts = fmtTimestamp(ev.created_at);

      return `${house.icon} ${house.label} – ${r.name} admitted (${ts})`;
    };

    const formatDischarge = (ev) => {
      const house = getHouseInfo(ev.house_id);
      const r = getResident(ev.resident_id);
      const ts = fmtTimestamp(ev.created_at);
      const reason = ev.discharge_reason || "no reason recorded";

      return `${house.icon} ${house.label} – ${r.name} – ${reason} (${ts})`;
    };

    const formatNote = (n) => {
      const house = getHouseInfo(n.house_id);
      const r = getResident(n.resident_id);
      const ts = fmtTimestamp(n.created_at);
      const shift = n.shift_name || "";

      return `${house.icon} ${house.label} – ${r.name} – “${n.note_text}” (${shift}, ${ts})`;
    };

    function list(lines) {
      if (!lines.length) return "<p>None.</p>";
      return `<ul>${lines.map((l) => `<li>${l}</li>`).join("")}</ul>`;
    }

    const admissionsLines = admissions.map(formatAdmission);
    const dischargesLines = discharges.map(formatDischarge);
    const notesLines = notes.map(formatNote);

    // ---------------------------------------------------------
    // 8. Build HTML email body
    // ---------------------------------------------------------
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
      ${list(admissionsLines)}

      <h3>Discharges (Past 24 Hours)</h3>
      ${list(dischargesLines)}

      <h3>Observation Notes Logged</h3>
      <p><strong>Total notes:</strong> ${notesLines.length}</p>
      ${list(notesLines)}

      <p style="margin-top:20px;font-size:12px;color:#777;">
        Report generated automatically on ${now.toLocaleString("en-US", {
          timeZone: "America/New_York",
        })}.
      </p>
    `;

    // ---------------------------------------------------------
    // 9. Send email via Resend
    // ---------------------------------------------------------
    const payload = {
      from: "Oceanside Housing Reports <reports@oceansidehousing.llc>",
      to: [
        "derek@oceansidehousing.llc",
        "ocean1@oceansidehousing.llc",
        "ocean2@oceansidehousing.llc",

        // SPR leadership
        "derek@simplepathrecovery.net",
        "ocean1@simplepathrecovery.net",
        "ocean2@simplepathrecovery.net",
        "heidi@simplepathrecovery.net",
        "matt@simplepathrecovery.net",
        "cathy@simplepathrecovery.net",
        "dom@simplepathrecovery.net",
        "drew@simplepathrecovery.net",
        "jacquelyn@simplepathrecovery.net",
        "iris@simplepathrecovery.net",
        "paul@simplepathrecovery.net",
        "laurie@simplepathrecovery.net",
        "amy@simplepathrecovery.net"
      ],
      subject: `Oceanside Housing – Executive Summary (${now.toLocaleDateString(
        "en-US"
      )})`,
      html: htmlBody,
    };

    console.log("Resend payload:", { toCount: payload.to.length });

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error("Resend error:", response.status, text);
      throw new Error(`Resend failed with status ${response.status}`);
    }

    const result = await response.json();
    console.log("Resend success:", result);

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true }),
    };
  } catch (err) {
    console.error("Daily Summary Error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        message: err.message,
        code: err.code || null,
      }),
    };
  }
};
