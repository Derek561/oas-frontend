'use client';

import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

const supabase = createClientComponentClient();

export type BedSelection = {
  house_id: string | null;
  room_id: string | null;
  bed_id: string | null;
};

type UIBed = {
  bed_id: string;
  bed_label: string;
};

type UIRoom = {
  room_id: string;
  room_label: string;
  beds: UIBed[];
};

type UIHouse = {
  house_id: string;
  house_name: string;
  rooms: UIRoom[];
};

/**
 * Same nickname mapping as ResidentsPage.
 */
const HOUSE_NICKNAMES: Record<
  string,
  {
    label: string;
    icon: string;
  }
> = {
  '49cf4cfa-e783-4932-b14d-fa1be226111f': { label: '8th Court', icon: '🟡' },
  '308bb7cb-90f0-4e83-9d10-1c5b92c2bf0d': { label: '626', icon: '🟣' },
  '80ae39a3-be84-47e8-bada-6c59c466bbef': { label: 'Blue Building', icon: '🔵' },
};

function formatHouseLabel(house_id: string, house_name?: string | null) {
  const nick = HOUSE_NICKNAMES[house_id];
  if (!nick) return house_name || 'Unknown house';
  return `${nick.icon} ${nick.label}`;
}

interface BedAssignmentSelectorProps {
  value: BedSelection;
  onChange: (value: BedSelection) => void;
  className?: string;
  label?: string;
}

export default function BedAssignmentSelector({
  value,
  onChange,
  className,
  label = 'Housing (House / Room / Bed)',
}: BedAssignmentSelectorProps) {
  const [houses, setHouses] = useState<UIHouse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadBeds() {
      setLoading(true);

      const { data, error } = await supabase
        .from('v_housing_grid_complete')
        .select(
          `
          bed_id,
          bed_label,
          is_occupied,
          room_id,
          room_label,
          house_id,
          house_name
        `,
        )
        .eq('is_occupied', false)
        .order('house_name', { ascending: true })
        .order('room_label', { ascending: true })
        .order('bed_label', { ascending: true });

      if (cancelled) return;

      if (error) {
        console.error('Load beds for selector error:', error.message);
        setHouses([]);
        setLoading(false);
        return;
      }

      const grouped: Record<string, UIHouse> = {};

      for (const row of data ?? []) {
        if (!row.house_id || !row.room_id || !row.bed_id) continue;

        if (!grouped[row.house_id]) {
          grouped[row.house_id] = {
            house_id: row.house_id,
            house_name: row.house_name ?? 'Unknown House',
            rooms: [],
          };
        }

        const house = grouped[row.house_id];

        let room = house.rooms.find((r) => r.room_id === row.room_id);
        if (!room) {
          room = {
            room_id: row.room_id,
            room_label: row.room_label ?? 'Unknown Room',
            beds: [],
          };
          house.rooms.push(room);
        }

        room.beds.push({
          bed_id: row.bed_id,
          bed_label: row.bed_label ?? 'Bed',
        });
      }

      setHouses(Object.values(grouped));
      setLoading(false);
    }

    loadBeds();

    return () => {
      cancelled = true;
    };
  }, []);

  const selectedHouse =
    houses.find((h) => h.house_id === value.house_id) ?? null;
  const rooms = selectedHouse?.rooms ?? [];
  const selectedRoom =
    rooms.find((r) => r.room_id === value.room_id) ?? null;
  const beds = selectedRoom?.beds ?? [];

  function update(newPartial: Partial<BedSelection>) {
    const next: BedSelection = {
      house_id: newPartial.house_id ?? value.house_id,
      room_id: newPartial.room_id ?? value.room_id,
      bed_id: newPartial.bed_id ?? value.bed_id,
    };
    onChange(next);
  }

  function handleHouseChange(houseId: string | null) {
    update({ house_id: houseId, room_id: null, bed_id: null });
  }

  function handleRoomChange(roomId: string | null) {
    update({ room_id: roomId, bed_id: null });
  }

  function handleBedChange(bedId: string | null) {
    update({ bed_id: bedId });
  }

  return (
    <div className={cn('space-y-2', className)}>
      <Label className="text-sm font-medium">{label}</Label>

      {loading && (
        <div className="text-xs text-gray-500">
          Loading available beds…
        </div>
      )}

      {!loading && houses.length === 0 && (
        <div className="text-xs text-red-500">
          No available beds found. (All beds are currently occupied.)
        </div>
      )}

      <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
        {/* House */}
        <div>
          <Label className="text-xs text-gray-500">House</Label>
          <Select
            value={value.house_id ?? ''}
            onValueChange={(v) => handleHouseChange(v || null)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select house" />
            </SelectTrigger>
            <SelectContent>
              {houses.map((house) => (
                <SelectItem key={house.house_id} value={house.house_id}>
                  {formatHouseLabel(house.house_id, house.house_name)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Room */}
        <div>
          <Label className="text-xs text-gray-500">Room</Label>
          <Select
            value={value.room_id ?? ''}
            onValueChange={(v) => handleRoomChange(v || null)}
            disabled={!selectedHouse}
          >
            <SelectTrigger>
              <SelectValue
                placeholder={selectedHouse ? 'Select room' : 'Select house first'}
              />
            </SelectTrigger>
            <SelectContent>
              {rooms.map((room) => (
                <SelectItem key={room.room_id} value={room.room_id}>
                  {room.room_label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Bed */}
        <div>
          <Label className="text-xs text-gray-500">Bed</Label>
          <Select
            value={value.bed_id ?? ''}
            onValueChange={(v) => handleBedChange(v || null)}
            disabled={!selectedRoom}
          >
            <SelectTrigger>
              <SelectValue
                placeholder={selectedRoom ? 'Select bed' : 'Select room first'}
              />
            </SelectTrigger>
            <SelectContent>
              {beds.map((bed) => (
                <SelectItem key={bed.bed_id} value={bed.bed_id}>
                  {bed.bed_label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
