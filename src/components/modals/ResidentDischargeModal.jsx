'use client';

import { useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

const supabase = createClientComponentClient();

/**
 * @param {{
 *  resident: any,
 *  open: boolean,
 *  onClose: () => void,
 *  onDischarged: () => void
 * }} props
 */
export default function ResidentDischargeModal({
  resident,
  open,
  onClose,
  onDischarged,
}) {
  const [reason, setReason] = useState('With Staff Approval (WSA)');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  if (!open || !resident) return null;

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);

    try {
      // 1) Record discharge event
      const { error: eventError } = await supabase
        .from('resident_events')
        .insert([
          {
            resident_id: resident.id,
            house_id: resident.house_id,
            event_type: 'discharge',
            discharge_reason: reason,
            notes,
          },
        ]);

      if (eventError) {
        console.error('Discharge event error:', eventError.message);
        alert('Unable to record discharge event.');
        setSaving(false);
        return;
      }

      const today = new Date();
      const todayIso = today.toISOString().split('T')[0];

      // 2) Update resident row
      const { error: updateError } = await supabase
        .from('residents')
        .update({
          status: 'Discharged',
          clinical_status: resident.clinical_status || 'Active',
          discharge_date: todayIso,
          is_active: false,
          discharged_at: today.toISOString(),
        })
        .eq('id', resident.id);

      if (updateError) {
        console.error('Discharge resident error:', updateError.message);
        alert('Unable to update resident discharge status.');
        setSaving(false);
        return;
      }

      // 3) Free bed if any
      if (resident.bed_id) {
        const { error: bedError } = await supabase
          .from('beds')
          .update({
            is_occupied: false,
            occupied_by: null,
          })
          .eq('id', resident.bed_id);

        if (bedError) {
          console.error('Free bed on discharge error:', bedError.message);
          // Do not hard-fail discharge if bed update fails
        }
      }

      alert('✅ Discharge recorded.');
      onDischarged && onDischarged();
      onClose && onClose();
    } catch (err) {
      console.error('Discharge submission failed:', err);
      alert('Unexpected error saving discharge.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
        <h2 className="mb-4 text-lg font-semibold">
          Discharge {resident.last_name}, {resident.first_name}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="mb-1 block text-sm font-medium">
              Discharge Reason
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full rounded border border-gray-300 p-2 text-sm"
            >
              <option>With Staff Approval (WSA)</option>
              <option>Against Staff Advice (ASA)</option>
              <option>Administrative Discharge (AD)</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">
              Discharge Notes
            </label>
            <textarea
              placeholder="Discharge notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded border border-gray-300 p-2 text-sm"
              rows={3}
            />
          </div>

          <div className="mt-4 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded border border-gray-300 px-3 py-1 text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded bg-blue-600 px-3 py-1 text-sm font-semibold text-white"
            >
              {saving ? 'Saving…' : 'Save Discharge'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
