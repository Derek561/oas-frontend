// netlify/functions/dailySummary.js
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

export const handler = async function (event, context) {
  console.log("Running DAILY SUMMARY (production)...");

  const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

  const resend = new Resend(process.env.RESEND_API_KEY);

  try {
    // -----------------------------
    // 1. House Order + Nicknames
    // -----------------------------
    const HOUSE_ORDER = {
      '49cf4cfa-e783-4932-b14d-fa1be226111f': { label: '8th Court', icon: '🟡' },
      '308bb7cb-90f0-4e83-9d10-1c5b92c2bf0d': { label: '626', icon: '🟣' },
      '80ae39a3-be84-47e8-bada-6c59c466bbef': { label: 'Blue Building', icon: '🔵' }
    };

    // -----------------------------
    // 2. Load all beds
    // -----------------------------
    const { data: beds, error: bedsErr } = await supabase
      .from('beds')
      .select('id, house_id, room_id, label, is_occupied, occupied_by');

    if (bedsErr) throw bedsErr;

    // Group & compute census stats
    const censusByHouse = Object.keys(HOUSE_ORDER).map(hid => {
      const houseBeds = beds.filter(b => b.house_id === hid);

      const totalBeds = houseBeds.length;

      // FIXED — real occupancy check
      const occupied = houseBeds.filter(b => b.is_occupied === true).length;

      const available = totalBeds - occupied;

      const pct = totalBeds > 0
        ? ((occupied / totalBeds) * 100).toFixed(1)
        : '0.0';

      return {
        house_id: hid,
        label: HOUSE_ORDER[hid].label,
        icon: HOUSE_ORDER[hid].icon,
        totalBeds,
        occupied,
        available,
        pct
      };
    });

    // -----------------------------
    // 3. Admissions / Discharges
    // -----------------------------
    const last24 = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const { data: events, error: eventsErr } = await supabase
      .from('resident_events')
      .select('id, resident_id, house_id, event_type, ua_result, bac_result, event_details, discharge_reason, notes, created_at')
      .gte('created_at', last24)
      .in('event_type', ['admission', 'discharge']);

    if (eventsErr) throw eventsErr;

    const safeEvents = events || [];
    const admissions = safeEvents.filter(e => e.event_type === 'admission');
    const discharges = safeEvents.filter(e => e.event_type === 'discharge');

    // -----------------------------
    // 4. Observation Notes (Past 24 Hours)
    // -----------------------------
    const { data: notes, error: notesErr } = await supabase
      .from('observation_notes')
      .select('id, resident_id, house_id, note_text, shift_name, created_at')
      .gte('created_at', last24);

    if (notesErr) throw notesErr;

    const safeNotes = notes || [];

    // Load residents referenced by events/notes
    const residentIds = new Set();
    safeEvents.forEach(e => residentIds.add(e.resident_id));
    safeNotes.forEach(n => residentIds.add(n.resident_id));

    let residentMap = new Map();
    if (residentIds.size > 0) {
      const { data: residents, error: resErr } = await supabase
        .from('residents')
        .select('id, first_name, last_name')
        .in('id', Array.from(residentIds));

      if (resErr) throw resErr;

      residentMap = new Map(
        residents.map(r => [
          r.id,
          `${r.first_name || ''} ${r.last_name || ''}`.trim()
        ])
      );
    }

    // -----------------------------
    // 5. Format functions
    // -----------------------------
    function fmtTime(ts) {
      return new Date(ts).toLocaleString('en-US', { timeZone: 'America/New_York' });
    }

    function formatAdmission(ev) {
      const name = residentMap.get(ev.resident_id) || 'Unknown';
      const ts = fmtTime(ev.created_at);
      const ua = ev.ua_result ? ` | UA: ${ev.ua_result}` : '';
      const bac = ev.bac_result ? ` | BAC: ${ev.bac_result}` : '';
      const det = ev.event_details ? ` | ${ev.event_details}` : '';
      const house = HOUSE_ORDER[ev.house_id] || { label: 'Unknown', icon: '🏠' };

      return `${house.icon} <strong>${house.label}</strong> — ${name}${ua}${bac}${det} (${ts})`;
    }

    function formatDischarge(ev) {
      const name = residentMap.get(ev.resident_id) || 'Unknown';
      const ts = fmtTime(ev.created_at);
      const reason = ev.discharge_reason ? ` | ${ev.discharge_reason}` : '';
      const notes = ev.notes ? ` | ${ev.notes}` : '';
      const house = HOUSE_ORDER[ev.house_id] || { label: 'Unknown', icon: '🏠' };

      return `${house.icon} <strong>${house.label}</strong> — ${name}${reason}${notes} (${ts})`;
    }

    const admissionsLines = admissions.map(formatAdmission);
    const dischargesLines = discharges.map(formatDischarge);

    // -----------------------------
    // 6. Observation Section HTML
    // -----------------------------
    const observationSectionHtml = `
<h3>Observation Notes (Past 24 Hours)</h3>
<p><strong>Total notes:</strong> ${safeNotes.length}</p>

${safeNotes.length === 0 ? '<p>No observations recorded.</p>' : `
  <ul>
    ${safeNotes
      .map(n => {
        const house = HOUSE_ORDER[n.house_id] || { label: 'Unknown', icon: '🏠' };
        const name = residentMap.get(n.resident_id) || 'Unknown';
        const ts = fmtTime(n.created_at);
        return `<li>${house.icon} <strong>${house.label}</strong> — ${name} (${ts})<br>${n.note_text}</li>`;
      })
      .join('')}
  </ul>
`}
`;

      // -----------------------------
  // 7. Build HTML Email Body
  // -----------------------------
  const htmlBody = `
<h2>Oceanside Housing – Executive Summary (Past 24 Hours)</h2>

<h3>Census Snapshot</h3>
<ul>
  ${censusByHouse
    .map(
      (c) =>
        `<li>${c.icon} <strong>${c.label}</strong>: ${c.occupied} / ${c.totalBeds}</li>`
    )
    .join('')}
</ul>

<p><strong>Total Beds:</strong> 39</p>
<p><strong>Occupied:</strong> ${censusByHouse.reduce((n, h) => n + h.occupied, 0)}</p>
<p><strong>Available:</strong> ${censusByHouse.reduce((n, h) => n + h.available, 0)}</p>
<p><strong>Occupancy Rate:</strong> ${(
  (censusByHouse.reduce((n, h) => n + h.occupied, 0) /
    (censusByHouse.reduce((n, h) => n + h.totalBeds, 0) || 1)) * 100
).toFixed(1)}%</p>

<h3>Admissions (Past 24 Hours)</h3>
${admissionsLines.length === 0
  ? '<p>No admissions.</p>'
  : `<ul>${admissionsLines.map((i) => `<li>${i}</li>`).join('')}</ul>`}

<h3>Discharges (Past 24 Hours)</h3>
${dischargesLines.length === 0
  ? '<p>No discharges.</p>'
  : `<ul>${dischargesLines.map((i) => `<li>${i}</li>`).join('')}</ul>`}

${observationSectionHtml}

<p style="margin-top:20px; font-size:12px; color:#777;">
Report generated automatically on ${new Date().toLocaleString('en-US', {
  timeZone: 'America/New_York',
})}
</p>
`;

    // -----------------------------
    // 8. Send Email via Resend
    // -----------------------------
    const payload = {
      from: 'Oceanside Housing Reports <reports@oceansidehousing.llc>',
      to: [
        'ocean1@oceansidehousing.llc',
        'ocean2@oceansidehousing.llc',
        'derek@simplerecovery.net',
        'heidi@simplerecovery.net',
        'matt@simplerecovery.net',
        'cathy@simplerecovery.net',
        'drew@simplerecovery.net',
        'jacquelyn@simplerecovery.net',
        'iris@simplerecovery.net',
        'paul@simplerecovery.net',
        'laurie@simplerecovery.net',
        'amy@simplerecovery.net'
      ],
      subject: `Oceanside Housing – Executive Summary (${new Date().toLocaleDateString('en-US')})`,
      html: htmlBody
    };

    console.log("Resend payload (meta only):", {
      toCount: payload.to.length,
      subject: payload.subject
    });

    const emailResult = await resend.emails.send(payload);
    console.log("Resend success:", emailResult);

    return {
      statusCode: 200,
      body: "Daily summary email sent."
    };
  } catch (err) {
    console.error("Daily Summary Error:", err);
    return {
      statusCode: 500,
      body: "Daily summary failed."
    };
  }
};
