'use client';

import type React from 'react';
import { useEffect, useMemo, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { format } from 'date-fns';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';

import BedAssignmentSelector from '@/components/BedAssignmentSelector';
import ResidentEditModal from '@/components/modals/ResidentEditModal';
import ResidentReAdmitModal from '@/components/modals/ResidentReAdmitModal';

const supabase = createClientComponentClient();

/** House nickname mapping (by house_id). Must match the houses table UUIDs. */
const HOUSE_NICKNAMES: Record<
  string,
  {
    label: string;
    icon: string;
  }
> = {
  // Oceanside House A – "8th Court"
  '49cf4cfa-e783-4932-b14d-fa1be226111f': { label: '8th Court', icon: '🟡' },

  // Oceanside House B – "626"
  '308bb7cb-90f0-4e83-9d10-1c5b92c2bf0d': { label: '626', icon: '🟣' },

  // Blue Building – "Blue Building"
  '80ae39a3-be84-47e8-bada-6c59c466bbef': { label: 'Blue Building', icon: '🔵' },
};

function formatHouseName(house_id?: string | null, house_name?: string | null) {
  if (!house_id) return house_name || '—';
  const nick = HOUSE_NICKNAMES[house_id];
  if (!nick) return house_name || '—';
  return `${nick.icon} ${nick.label}`;
}

type ResidentRow = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  status: string | null;
  clinical_status: string | null; // now used as LOC
  admission_date: string | null;
  discharge_date: string | null;
  dob: string | null;
  gender: string | null;
  phone: string | null;
  email: string | null;
  house_id: string | null;
  room_id: string | null;
  bed_id: string | null;
  house_name: string | null;
  room_number: string | null;
};

const LOC_OPTIONS = [
  'PHP',
  'IOP 5-day',
  'IOP 3-day',
  'OP',
  'Halfway',
  'Unknown',
] as const;

type LocOption = (typeof LOC_OPTIONS)[number];

function locBadgeColor(loc: string | null | undefined): string {
  switch (loc) {
    case 'PHP':
      return 'bg-blue-100 text-blue-700';
    case 'IOP 5-day':
      return 'bg-indigo-100 text-indigo-700';
    case 'IOP 3-day':
      return 'bg-purple-100 text-purple-700';
    case 'OP':
      return 'bg-emerald-100 text-emerald-700';
    case 'Halfway':
      return 'bg-amber-100 text-amber-700';
    case 'Unknown':
    default:
      return 'bg-gray-100 text-gray-700';
  }
}

export default function ResidentsPage() {
  const [residents, setResidents] = useState<ResidentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingAdd, setSavingAdd] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Intake form state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [locLevel, setLocLevel] = useState<LocOption>('PHP');
  const [admissionDate, setAdmissionDate] = useState('');

  const [bedSelection, setBedSelection] = useState<{
    house_id: string | null;
    room_id: string | null;
    bed_id: string | null;
  }>({
    house_id: null,
    room_id: null,
    bed_id: null,
  });

  // Modals
  const [editingResident, setEditingResident] = useState<ResidentRow | null>(null);
  const [editOpen, setEditOpen] = useState(false);

  const [reAdmitResident, setReAdmitResident] = useState<ResidentRow | null>(null);
  const [reAdmitOpen, setReAdmitOpen] = useState(false);

  // ---------------------------------------------------------------------------
  // Load residents
  // ---------------------------------------------------------------------------

  async function fetchResidents() {
    setLoading(true);

    const { data, error } = await supabase
      .from('residents_full_view')
      .select(
        `
        id,
        first_name,
        last_name,
        status,
        clinical_status,
        admission_date,
        discharge_date,
        dob,
        gender,
        phone,
        email,
        house_id,
        room_id,
        bed_id,
        house_name,
        room_number
      `,
      )
      .order('last_name', { ascending: true });

    if (error) {
      console.error('Load residents error:', error.message);
      setResidents([]);
      setLoading(false);
      return;
    }

    setResidents((data || []) as ResidentRow[]);
    setLoading(false);
  }

  useEffect(() => {
    fetchResidents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey]);

  // Derived lists
  const activeResidents = useMemo(
    () =>
      residents.filter(
        (r) => (r.status || '').toLowerCase() === 'active',
      ),
    [residents],
  );

  const dischargedResidents = useMemo(
    () =>
      residents
        .filter(
          (r) => (r.status || '').toLowerCase() === 'discharged',
        )
        .sort((a, b) => {
          const da = a.discharge_date || '';
          const db = b.discharge_date || '';
          return db.localeCompare(da);
        }),
    [residents],
  );

  function resetAddForm() {
    setFirstName('');
    setLastName('');
    setDob('');
    setGender('');
    setPhone('');
    setEmail('');
    setLocLevel('PHP');
    setAdmissionDate('');
    setBedSelection({ house_id: null, room_id: null, bed_id: null });
  }

  // ---------------------------------------------------------------------------
  // Add Resident
  // ---------------------------------------------------------------------------

  async function handleAddResident(e: React.FormEvent) {
    e.preventDefault();

    if (!firstName.trim() || !lastName.trim()) {
      alert('First and last name are required.');
      return;
    }

    if (!email.trim()) {
      alert('Email is required.');
      return;
    }

    if (!bedSelection.house_id || !bedSelection.room_id || !bedSelection.bed_id) {
      alert('Please select a house, room, and bed.');
      return;
    }

    setSavingAdd(true);

    try {
      const effectiveAdmission =
        admissionDate || format(new Date(), 'yyyy-MM-dd');

      const payload = {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        dob: dob || null,
        gender: gender || null,
        phone: phone.trim() || null,
        email: email.trim(),
        // 🔴 clinical_status now used as LOC (PHP, IOP, OP, etc.)
        clinical_status: locLevel,
        status: 'Active',
        admission_date: effectiveAdmission,
        discharge_date: null,
        house_id: bedSelection.house_id,
        room_id: bedSelection.room_id,
        bed_id: bedSelection.bed_id,
        is_active: true,
        admitted_at: new Date().toISOString(),
        discharged_at: null,
        controlling_house_id: bedSelection.house_id,
      };

      const { data: inserted, error: insertError } = await supabase
        .from('residents')
        .insert(payload)
        .select('id, bed_id')
        .single();

      if (insertError) {
        console.error('Insert resident error:', insertError.message);
        alert(`Unable to add resident. ${insertError.message}`);
        return;
      }

      if (inserted?.bed_id) {
        const { error: bedError } = await supabase
          .from('beds')
          .update({
            is_occupied: true,
            occupied_by: inserted.id,
          })
          .eq('id', inserted.bed_id);

        if (bedError) {
          console.error('Update bed occupancy error:', bedError.message);
        }
      }

      resetAddForm();
      setRefreshKey((k) => k + 1);
      alert('Resident added.');
    } finally {
      setSavingAdd(false);
    }
  }

  // ---------------------------------------------------------------------------
  // Discharge & Delete
  // ---------------------------------------------------------------------------

  async function handleDischarge(resident: ResidentRow) {
    if (!window.confirm('Discharge this resident?')) return;

    const todayIso = format(new Date(), 'yyyy-MM-dd');

    try {
      const { error: updateError } = await supabase
        .from('residents')
        .update({
          status: 'Discharged',
          // do NOT change LOC on discharge – keep clinical_status as-is
          discharge_date: todayIso,
          is_active: false,
          discharged_at: new Date().toISOString(),
        })
        .eq('id', resident.id);

      if (updateError) {
        console.error('Discharge resident error:', updateError.message);
        alert('Unable to discharge resident.');
        return;
      }

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
        }
      }

      setRefreshKey((k) => k + 1);
      alert('Resident discharged.');
    } catch (err) {
      console.error('Unexpected discharge error:', err);
      alert('Unexpected error discharging resident.');
    }
  }

  async function handleDelete(resident: ResidentRow) {
    if (!window.confirm('Permanently delete this resident record?')) return;

    try {
      if (resident.bed_id) {
        const { error: bedError } = await supabase
          .from('beds')
          .update({
            is_occupied: false,
            occupied_by: null,
          })
          .eq('id', resident.bed_id);

        if (bedError) {
          console.error('Free bed on delete error:', bedError.message);
        }
      }

      const { error: deleteError } = await supabase
        .from('residents')
        .delete()
        .eq('id', resident.id);

      if (deleteError) {
        console.error('Delete resident error:', deleteError.message);
        alert('Unable to delete resident.');
        return;
      }

      setRefreshKey((k) => k + 1);
      alert('Resident deleted.');
    } catch (err) {
      console.error('Unexpected delete error:', err);
      alert('Unexpected error deleting resident.');
    }
  }

  if (loading) {
    return (
      <div className="p-6 text-sm text-gray-500">
        Loading residents…
      </div>
    );
  }

  return (
    <ScrollArea className="h-[calc(100vh-80px)]">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold">Residents</h2>
            <p className="text-sm text-gray-500">
              Manage residents, housing assignments, and level of care.
            </p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[380px,1fr]">
          {/* Left: Intake */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">
                Add Resident Intake
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddResident} className="space-y-4">
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <div>
                    <Label>First Name</Label>
                    <Input
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label>Last Name</Label>
                    <Input
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label>DOB</Label>
                    <Input
                      type="date"
                      value={dob}
                      onChange={(e) => setDob(e.target.value)}
                    />
                  </div>
                  <div>
  <Label>Gender</Label>
  <select
    value={gender}
    onChange={(e) => setGender(e.target.value)}
    className="border p-2 rounded w-full"
  >
    <option value="">Select gender</option>
    <option value="Male">Male</option>
    <option value="Female">Female</option>
  </select>
</div>

                  <div>
                    <Label>Phone</Label>
                    <Input
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Email</Label>
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label>Level of Care (LOC)</Label>
                    <select
                      value={locLevel}
                      onChange={(e) => setLocLevel(e.target.value as LocOption)}
                      className="mt-1 w-full rounded border border-gray-300 p-2 text-sm"
                    >
                      {LOC_OPTIONS.map((loc) => (
                        <option key={loc} value={loc}>
                          {loc}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label>Admission Date</Label>
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
                  label="Housing (House / Room / Bed)"
                />

                <div className="flex justify-end gap-2 pt-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={resetAddForm}
                    disabled={savingAdd}
                  >
                    Clear
                  </Button>
                  <Button type="submit" disabled={savingAdd}>
                    {savingAdd ? 'Saving…' : 'Add Resident'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Right: Current residents */}
          <Card className="overflow-hidden">
            <CardHeader>
              <CardTitle className="text-base font-semibold">
                Current Residents
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[520px]">
                <table className="min-w-full text-sm">
                  <thead className="sticky top-0 bg-gray-50 text-xs uppercase text-gray-500">
                    <tr>
                      <th className="px-3 py-2 text-left">Name</th>
                      <th className="px-3 py-2 text-left">Phone</th>
                      <th className="px-3 py-2 text-left">House</th>
                      <th className="px-3 py-2 text-left">Room</th>
                      <th className="px-3 py-2 text-left">LOC</th>
                      <th className="px-3 py-2 text-left">Admission</th>
                      <th className="px-3 py-2 text-left">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeResidents.map((r) => (
                      <tr key={r.id} className="border-t">
                        <td className="px-3 py-2">
                          {(r.last_name || '').trim() || '—'},{' '}
                          {(r.first_name || '').trim() || '—'}
                        </td>
                        <td className="px-3 py-2">
                          {r.phone?.trim() || '—'}
                        </td>
                        <td className="px-3 py-2">
                          {formatHouseName(r.house_id, r.house_name)}
                        </td>
                        <td className="px-3 py-2">
                          {r.room_number || '—'}
                        </td>
                        <td className="px-3 py-2">
                          <span
                            className={
                              'inline-flex rounded-full px-2 py-1 text-xs font-semibold ' +
                              locBadgeColor(r.clinical_status)
                            }
                          >
                            {r.clinical_status || 'Unknown'}
                          </span>
                        </td>
                        <td className="px-3 py-2">
                          {r.admission_date
                            ? format(
                                new Date(r.admission_date),
                                'MM/dd/yyyy',
                              )
                            : '—'}
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex gap-2 text-xs">
                            <button
                              type="button"
                              className="text-blue-600 hover:underline"
                              onClick={() => {
                                setEditingResident(r);
                                setEditOpen(true);
                              }}
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              className="text-blue-600 hover:underline"
                              onClick={() => handleDischarge(r)}
                            >
                              Discharge
                            </button>
                            <button
                              type="button"
                              className="text-red-600 hover:underline"
                              onClick={() => handleDelete(r)}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {activeResidents.length === 0 && (
                      <tr>
                        <td
                          colSpan={7}
                          className="px-3 py-4 text-center text-xs text-gray-500"
                        >
                          No active residents.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Discharged residents */}
        {dischargedResidents.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">
                Discharged Residents
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-2 text-xs text-gray-500">
                Most recent discharges listed first.
              </div>
              <div className="space-y-1 text-sm">
                {dischargedResidents.map((r) => (
                  <div
                    key={r.id}
                    className="flex items-center justify-between border-b py-1 last:border-0"
                  >
                    <div>
                      <div className="font-medium">
                        {(r.last_name || '').trim() || '—'},{' '}
                        {(r.first_name || '').trim() || '—'}
                      </div>
                      <div className="text-xs text-gray-500">
                        {r.discharge_date
                          ? `Discharged ${format(
                              new Date(r.discharge_date),
                              'MM/dd/yyyy',
                            )}`
                          : 'Discharged (date missing)'}
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>
                        {formatHouseName(r.house_id, r.house_name)} /{' '}
                        {r.room_number || '—'}
                      </span>
                      <button
                        type="button"
                        className="text-blue-600 hover:underline"
                        onClick={() => {
                          setReAdmitResident(r);
                          setReAdmitOpen(true);
                        }}
                      >
                        Re-admit
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Modals */}
      <ResidentEditModal
        resident={editingResident}
        open={editOpen && !!editingResident}
        onClose={() => setEditOpen(false)}
        onSaved={() => setRefreshKey((k) => k + 1)}
      />

      <ResidentReAdmitModal
        resident={reAdmitResident}
        open={reAdmitOpen && !!reAdmitResident}
        onClose={() => setReAdmitOpen(false)}
        onReAdmitted={() => setRefreshKey((k) => k + 1)}
      />
    </ScrollArea>
  );
}
