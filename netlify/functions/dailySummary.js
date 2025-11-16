// netlify/functions/dailySummary.js
const { createClient } = require("@supabase/supabase-js");

/* ----------------------------------------------------------
   BUILDING LABELS (ICON + NAME)
----------------------------------------------------------- */
function buildingLabel(gender) {
  if (gender === "Male") return "🟥 Building A";
  if (gender === "Female") return "🟩 Building B";
  return "🔵 Building C"; // Coed or unknown
}

/* ----------------------------------------------------------
   TIMESTAMP FORMAT (MM/DD HH:MM AM/PM)
----------------------------------------------------------- */
function formatTimestamp(iso) {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    const opts = {
      timeZone: "America/New_York",
      month: "2-digit",
      day: "2-digit",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    };
    return d.toLocaleString("en-US", opts).replace(",", "");
  } catch {
    return iso;
  }
}

/* ----------------------------------------------------------
   MAIN HANDLER
----------------------------------------------------------- */
exports.handler = async function (event, context) {
  console.log("Running DAILY SUMMARY (production)…");

  try {
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const now = new Date();
    const last24 = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();

    /* ------------------------------------------------------
       1. LOAD BUILDING (HOUSE) METADATA
    ------------------------------------------------------- */
    const { data: houses, error: housesErr } = await supabase
      .from("houses")
      .select("id, name, gender");

    if (housesErr) throw housesErr;

    const houseMap = new Map();
    houses.forEach((h) => houseMap.set(h.id, h));

    function getHouseInfo(houseId) {
      if (!houseId) return { icon: "🔵 Building C", name: "Building C" };
      const h = houseMap.get(houseId);
      if (!h) return { icon: "🔵 Building C", name: "Building C" };

      return {
        icon: buildingLabel(h.gender),
        name: h.name || "Unknown House",
      };
    }

    /* ------------------------------------------------------
       2. CENSUS SNAPSHOT (VW_ROOM_OCCUPANCY)
    ------------------------------------------------------- */
    const { data: census, error: censusErr } = await supabase
      .from("vw_room_occupancy")
      .select("*");

    if (censusErr) throw censusErr;

    let totalBeds = 0;
    let occupied = 0;

    const buildingCensus = {
      "🟥 Building A": { total: 0, occ: 0 },
      "🟩 Building B": { total: 0, occ: 0 },
      "🔵 Building C": { total: 0, occ: 0 },
    };

    census.forEach((row) => {
      const house = houseMap.get(row.house_id);
      const label = buildingLabel(house?.gender);
      totalBeds += row.capacity || 0;
      occupied += row.active_residents || 0;

      buildingCensus[label].total += row.capacity || 0;
      buildingCensus[label].occ += row.active_residents || 0;
    });

    const available = totalBeds - occupied;
    const pct = totalBeds
      ? ((occupied / totalBeds) * 100).toFixed(1)
      : "0.0";

    /* ------------------------------------------------------
       3. ADMISSIONS & DISCHARGES (LAST 24H)
    ------------------------------------------------------- */
    const { data: events, error: eventsErr } = await supabase
      .from("resident_events")
      .select(
        `
        id,
        resident_id,
        house_id,
        event_type,
        discharge_reason,
        notes,
        created_at
      `
      )
      .gte("created_at", last24)
      .in("event_type", ["admission", "discharge"]);

    if (eventsErr) throw eventsErr;

    const admissions = events
      .filter((e) => e.event_type === "admission")
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    const discharges = events
      .filter((e) => e.event_type === "discharge")
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    /* ------------------------------------------------------
       4. OBSERVATION NOTES
    ------------------------------------------------------- */
    const { data: notes, error: notesErr } = await supabase
      .from("observation_notes")
      .select("id, resident_id, house_id, note_text, shift_name, created_at")
      .gte("created_at", last24);

    if (notesErr) throw notesErr;

    const sortedNotes = notes.sort(
      (a, b) => new Date(b.created_at) - new Date(a.created_at)
    );

    /* ------------------------------------------------------
       5. RESIDENT NAMES
    ------------------------------------------------------- */
    const residentIds = new Set();
    [...admissions, ...discharges, ...sortedNotes].forEach((e) => {
      if (e.resident_id) residentIds.add(e.resident_id);
    });

    let residentMap = new Map();

    if (residentIds.size > 0) {
      const { data: residents, error: resErr } = await supabase
        .from("residents")
        .select("id, first_name, last_name, unit_number")
        .in("id", Array.from(residentIds));

      if (resErr) throw resErr;

      residentMap = new Map(
        residents.map((r) => [
          r.id,
          {
            name: `${r.first_name || ""} ${r.last_name || ""}`.trim(),
            unit: r.unit_number || null,
          },
        ])
      );
    }

    function getResident(rid) {
      return residentMap.get(rid) || { name: "Unknown", unit: null };
    }

    /* ------------------------------------------------------
       6. FORMAT OUTPUT LINES (FORMAT B)
    ------------------------------------------------------- */
    const formatAdmission = (ev) => {
      const house = getHouseInfo(ev.house_id);
      const r = getResident(ev.resident_id);
      const ts = formatTimestamp(ev.created_at);
      const unit = r.unit ? ` (Unit ${r.unit})` : "";
      return `${house.icon} – ${r.name}${unit} – admitted (${ts})`;
    };

    const formatDischarge = (ev) => {
      const house = getHouseInfo(ev.house_id);
      const r = getResident(ev.resident_id);
      const ts = formatTimestamp(ev.created_at);
      const note = ev.notes ? ` – "${ev.notes}"` : "";
      const reason = ev.discharge_reason || "No reason recorded";
      return `${house.icon} – ${r.name} – ${reason}${note} (${ts})`;
    };

    const formatNote = (n) => {
      const house = getHouseInfo(n.house_id);
      const r = getResident(n.resident_id);
      const ts = formatTimestamp(n.created_at);
      const shift = n.shift_name || "";
      return `${house.icon} – ${r.name} – "${n.note_text}" (${shift}, ${ts})`;
    };

    /* ------------------------------------------------------
       7. BUILD EMAIL BODY
    ------------------------------------------------------- */
    function list(lines) {
      if (!lines.length) return "<p>None.</p>";
      return `<ul>${lines.map((l) => `<li>${l}</li>`).join("")}</ul>`;
    }

    const htmlBody = `
      <h2>Oceanside Housing – Executive Summary (Past 24 Hours)</h2>

      <h3>Census Snapshot</h3>
      <ul>
        <li><strong>🟥 Building A:</strong> ${
          buildingCensus["🟥 Building A"].occ
        } / ${buildingCensus["🟥 Building A"].total}</li>
        <li><strong>🟩 Building B:</strong> ${
          buildingCensus["🟩 Building B"].occ
        } / ${buildingCensus["🟩 Building B"].total}</li>
        <li><strong>🔵 Building C:</strong> ${
          buildingCensus["🔵 Building C"].occ
        } / ${buildingCensus["🔵 Building C"].total}</li>
      </ul>

      <p><strong>Total Beds:</strong> ${totalBeds}</p>
      <p><strong>Occupied:</strong> ${occupied}</p>
      <p><strong>Available:</strong> ${available}</p>
      <p><strong>Occupancy Rate:</strong> ${pct}%</p>

      <h3>Admissions (Past 24 Hours)</h3>
      ${list(admissions.map(formatAdmission))}

      <h3>Discharges (Past 24 Hours)</h3>
      ${list(discharges.map(formatDischarge))}

      <h3>Observation Notes Logged</h3>
      ${list(sortedNotes.map(formatNote))}

      <p style="margin-top:20px;font-size:12px;color:#777;">
        Report generated automatically on ${now.toLocaleString("en-US", {
          timeZone: "America/New_York",
        })}.
      </p>
    `;

    /* ------------------------------------------------------
       8. SEND EMAIL (RESEND)
    ------------------------------------------------------- */
    const payload = {
      from: "Oceanside Housing Reports <reports@oceansidehousing.llc>",
      to: [
        "derek@oceansidehousing.llc",
        "ocean1@oceansidehousing.llc",
        "ocean2@oceansidehousing.llc",
        "derek@simplepathrecovery.net",
        "heidi@simplepathrecovery.net",
        "matt@simplepathrecovery.net",
        "cathy@simplepathrecovery.net",
        "dom@simplepathrecovery.net",
        "drew@simplepathrecovery.net",
        "jacquelyn@simplepathrecovery.net",
        "iris@simplepathrecovery.net",
        "paul@simplepathrecovery.net",
        "laurie@simplepathrecovery.net",
        "amy@simplepathrecovery.net",
      ],
      subject: `Oceanside Housing – Executive Summary (${now.toLocaleDateString(
        "en-US"
      )})`,
      html: htmlBody,
    };

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
