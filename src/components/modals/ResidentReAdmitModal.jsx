'use client';

import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { format } from 'date-fns';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import BedAssignmentSelector from '@/components/BedAssignmentSelector';

const supabase = createClientComponentClient();

/**
 * @param {{ resident: any, open: boolean, onClose: () => void, onReAdmitted: () => void }} props
 */
export default function ResidentReAdmitModal({
  resident,
  open,
  onClose,
  onReAdmitted,
}) {
  const [admissionDate, setAdmissionDate] = useState('');
  const [bedSelection, setBedSelection] = useState({
    house_id: null,
    room_id: null,
    bed_id: null,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!resident || !open) return;
    setAdmissionDate(format(new Date(), 'yyyy-MM-dd'));
    setBedSelection({ house_id: null, room_id: null, bed_id: null });
  }, [resident, open]);

  if (!open || !resident) return null;

  async function handleSubmit(e) {
    e.preventDefault();

    if (!admissionDate) {
      alert('Admission date is required.');
      return;
    }

    if (!bedSelection.house_id || !bedSelection.room_id || !bedSelection.bed_id) {
      alert('Please select a house, room, and bed.');
      return;
    }

    setSaving(true);

    try {
      // 1. Free previous bed if any
      if (resident.bed_id) {
        const { error: oldBedError } = await supabase
          .from('beds')
          .update({
            is_occupied: false,
            occupied_by: null,
          })
          .eq('id', resident.bed_id);

        if (oldBedError) {
          console.error('Free old bed on re-admit error:', oldBedError.message);
        }
      }

      // 2. Update resident record
      const { error: updateError } = await supabase
        .from('residents')
        .update({
  status: 'Active',
  clinical_status: 'Active',
  admission_date: admissionDate,
  discharge_date: null,
  house_id: bedSelection.house_id,
  room_id: bedSelection.room_id,
  bed_id: bedSelection.bed_id,
  controlling_house_id: bedSelection.house_id,
  is_active: true,
  admitted_at: new Date().toISOString(),
  discharged_at: null,
})
        .eq('id', resident.id);

      if (updateError) {
        console.error('Re-admit resident error:', updateError.message);
        alert('Unable to re-admit resident.');
        return;
      }

      // 3. Occupy new bed
      if (bedSelection.bed_id) {
        const { error: bedError } = await supabase
          .from('beds')
          .update({
            is_occupied: true,
            occupied_by: resident.id,
          })
          .eq('id', bedSelection.bed_id);

        if (bedError) {
          console.error('Occupy bed on re-admit error:', bedError.message);
        }
      }

      onReAdmitted && onReAdmitted();
      onClose && onClose();
      alert('Resident re-admitted.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-lg">
        <h3 className="mb-4 text-lg font-semibold">
          Re-admit {resident.last_name}, {resident.first_name}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div>
              <Label>New Admission Date</Label>
              <Input
                type="date"
                value={admissionDate}
                onChange={(e) => setAdmissionDate(e.target.value)}
              />
            </div>
          </div>

          <BedAssignmentSelector
            value={bedSelection}
            onChange={setBedSelection}
            className="mt-2"
            label="New Housing (House / Room / Bed)"
          />

          <div className="mt-4 flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving…' : 'Re-admit'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
