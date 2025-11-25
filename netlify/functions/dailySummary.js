// netlify/functions/dailySummary.js
import { createClient } from '@supabase/supabase-js';

export async function handler(event, context) {
  console.log("Running DAILY SUMMARY (production)..."); // rebuild trigger

  try {
    // -------------------------------------------
    // 1. Supabase client
    // -------------------------------------------
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const now = new Date();
    const last24 = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();

    // -------------------------------------------
    // 2. House nickname + icon map
    // -------------------------------------------
    const HOUSE_NICKNAMES = {
      '49cf4cfa-e783-4932-b14d-fa1be226111f': { label: '8th Court', icon: '🟡' },
      '308bb7cb-90f0-4e83-9d10-1c5b92c2bf0d': { label: '626', icon: '🟣' },
      '80ae39a3-be84-47e8-bada-6c59c466bbef': { label: 'Blue Building', icon: '🔵' }
    };

    const HOUSE_ORDER = [
      '49cf4cfa-e783-4932-b14d-fa1be226111f',
      '308bb7cb-90f0-4e83-9d10-1c5b92c2bf0d',
      '80ae39a3-be84-47e8-bada-6c59c466bbef'
    ];

    function getHouseInfo(houseId) {
      if (!houseId) return { label: 'Unknown House', icon: '⚪' };
      return HOUSE_NICKNAMES[houseId] || { label: 'Unknown House', icon: '⚪' };
    }

    // --------------------------------------------
// 3. Census snapshot (calculated via beds table)
// --------------------------------------------

const { data: beds, error: bedsErr } = await supabase
  .from('beds')
  .select('id, house_id, resident_id');

if (bedsErr) throw bedsErr;

// Group beds by house
const censusByHouse = HOUSE_ORDER.map(hid => {
  const houseBeds = beds.filter(b => b.house_id === hid);

  const totalBeds = houseBeds.length;
  const occupied = houseBeds.filter(b => b.resident_id !== null).length;
  const available = totalBeds - occupied;
  const pct = totalBeds > 0 ? ((occupied / totalBeds) * 100).toFixed(1) : '0.0';

  return {
    house_id: hid,
    label: HOUSE_NICKNAMES[hid]?.label || 'Unknown',
    icon: HOUSE_NICKNAMES[hid]?.icon || '🏠',
    totalBeds,
    occupied,
    available,
    pct
  };
});

    // -------------------------------------------
    // 4. Events in last 24h
    // FIXED: ua_result, bac_result, event_details
    // -------------------------------------------
    const { data: events, error: eventsErr } = await supabase
      .from('resident_events')
      .select(
        'id, resident_id, house_id, event_type, ua_result, bac_result, event_details, discharge_reason, notes, created_at'
      )
      .gte('created_at', last24)
      .in('event_type', ['admission', 'discharge']);

    if (eventsErr) throw eventsErr;

    const safeEvents = events || [];
    const admissions = safeEvents.filter((e) => e.event_type === 'admission');
    const discharges = safeEvents.filter((e) => e.event_type === 'discharge');

    // -------------------------------------------
    // 5. Observation notes
    // -------------------------------------------
    const { data: notes, error: notesErr } = await supabase
      .from('observation_notes')
      .select('id, resident_id, house_id, note_text, shift_name, created_at')
      .gte('created_at', last24);

    if (notesErr) throw notesErr;

    const safeNotes = notes || [];

    // -------------------------------------------
    // 6. Resident names lookup
    // -------------------------------------------
    const residentIds = new Set();
    safeEvents.forEach((e) => residentIds.add(e.resident_id));
    safeNotes.forEach((n) => residentIds.add(n.resident_id));

    let residentMap = new Map();

    if (residentIds.size > 0) {
      const { data: residents, error: resErr } = await supabase
        .from('residents')
        .select('id, first_name, last_name')
        .in('id', Array.from(residentIds));

      if (resErr) throw resErr;

      residentMap = new Map(
        residents.map((r) => [
          r.id,
          { name: `${r.first_name || ''} ${r.last_name || ''}`.trim() }
        ])
      );
    }

    function getResidentName(rid) {
      return residentMap.get(rid)?.name || 'Unknown Resident';
    }

    function fmtDateTime(iso) {
      try {
        return new Date(iso).toLocaleString('en-US', {
          timeZone: 'America/New_York'
        });
      } catch {
        return iso;
      }
    }

    // -------------------------------------------
    // 7. Format lines (FIXED FIELDS)
    // -------------------------------------------
    function formatAdmission(ev) {
      const house = getHouseInfo(ev.house_id);
      const name = getResidentName(ev.resident_id);
      const ts = fmtDateTime(ev.created_at);

      const uaPart = ev.ua_result ? ` – UA: ${ev.ua_result}` : '';
      const bacPart = ev.bac_result ? ` – BAC: ${ev.bac_result}` : '';
      const detailPart = ev.event_details ? ` – ${ev.event_details}` : '';

      return `${house.icon} ${house.label} – ${name}${uaPart}${bacPart}${detailPart} (${ts})`;
    }

    function formatDischarge(ev) {
      const house = getHouseInfo(ev.house_id);
      const name = getResidentName(ev.resident_id);
      const ts = fmtDateTime(ev.created_at);

      const reason = ev.discharge_reason || 'No reason recorded';
      const notesPart = ev.notes ? ` – ${ev.notes}` : '';

      return `${house.icon} ${house.label} – ${name} – ${reason}${notesPart} (${ts})`;
    }

    const admissionsLines = admissions.map(formatAdmission);
    const dischargesLines = discharges.map(formatDischarge);

    // -------------------------------------------
// Helper: render list items in HTML
// -------------------------------------------
function renderList(arr) {
  if (!arr || arr.length === 0) return '<li>No entries recorded</li>';
  return arr.map((item) => `<li>${item}</li>`).join('');
}

// 7. Build Observation Notes HTML
const observationSectionHtml = `
  <h3>Observation Notes (Past 24 Hours)</h3>
  <p><strong>Total notes:</strong> ${safeNotes.length}</p>

  ${
    safeNotes.length === 0
      ? '<p>No observations recorded.</p>'
      : `<ul>
          ${safeNotes
            .map((n) => {
              const house = HOUSE_NICKNAMES[n.house_id] || { label: 'Unknown', icon: '🏠' };
              const ts = new Date(n.created_at).toLocaleString('en-US', { timeZone: 'America/New_York' });
              return `<li>${house.icon} <strong>${house.label}</strong> – ${n.note_text} (${ts})</li>`;
            })
            .join('')}
        </ul>`
  }
`;
    // -------------------------------------------
    // 8. Build HTML body
    // -------------------------------------------
    const htmlBody = `
      <h2>Oceanside Housing – Executive Summary (Past 24 Hours)</h2>

      <h3>Census Snapshot</h3>
      <ul>
  ${censusByHouse
    .map(c =>
      `<li>${c.icon} <strong>${c.label}:</strong> ${c.occupied} / ${c.totalBeds}</li>`
    )
    .join('')}
</ul>

<p><strong>Total Beds:</strong> ${censusByHouse.reduce((n, h) => n + h.totalBeds, 0)}</p>
<p><strong>Occupied:</strong> ${censusByHouse.reduce((n, h) => n + h.occupied, 0)}</p>
<p><strong>Available:</strong> ${censusByHouse.reduce((n, h) => n + h.available, 0)}</p>
<p><strong>Occupancy Rate:</strong> ${
  (
    censusByHouse.reduce((n, h) => n + h.occupied, 0) /
    censusByHouse.reduce((n, h) => n + h.totalBeds, 0)
  * 100).toFixed(1)
}%</p>

      <h3>Admissions (Past 24 Hours)</h3>
      ${
        admissionsLines.length === 0
          ? '<p>No admissions.</p>'
          : renderList(admissionsLines)
      }

      <h3>Discharges (Past 24 Hours)</h3>
      ${
        dischargesLines.length === 0
          ? '<p>No discharges.</p>'
          : renderList(dischargesLines)
      }
 ${observationSectionHtml}     

      <p style="margin-top:20px;font-size:12px;color:#777;">
        Report generated automatically on ${now.toLocaleString('en-US', {
          timeZone: 'America/New_York'
        })}.
      </p>
    `

    // -------------------------------------------
    // 9. Send email via Resend
    // -------------------------------------------
    const payload = {
      from: 'Oceanside Housing Reports <reports@oceansidehousing.llc>',
      to: [
        'derek@oceansidehousing.llc',
        'ocean1@oceansidehousing.llc',
        'ocean2@oceansidehousing.llc',
        'derek@simplepathrecovery.net',
        'heidi@simplepathrecovery.net',
        'matt@simplepathrecovery.net',
        'cathy@simplepathrecovery.net',
        'dom@simplepathrecovery.net',
        'drew@simplepathrecovery.net',
        'jacquelyn@simplepathrecovery.net',
        'iris@simplepathrecovery.net',
        'paul@simplepathrecovery.net',
        'laurie@simplepathrecovery.net',
        'amy@simplepathrecovery.net'
      ],
      subject: `Oceanside Housing – Executive Summary (${now.toLocaleDateString(
        'en-US'
      )})`,
      html: htmlBody
    }

    console.log('Resend payload (meta only):', {
      toCount: payload.to.length,
      subject: payload.subject
    })

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    })

    if (!response.ok) {
      const text = await response.text()
      console.error('Resend error:', response.status, text)
      throw new Error(`Resend failed with status ${response.status}`)
    }

    const result = await response.json()
    console.log('Resend success:', result)
    // -------------------------------------------
    // SUCCESS
    // -------------------------------------------
    return {
      statusCode: 200,
      body: JSON.stringify({ success: true })
    };

  } catch (err) {
    console.error("Daily Summary Error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        message: err.message,
        code: err.code || null
      })
    };
  }
}
