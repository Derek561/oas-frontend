'use client';

import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Card } from '@/components/ui/card';

const supabase = createClientComponentClient();

// Universal house nicknames by HOUSE ID
const HOUSE_NICKNAMES = {
  '308bb7cb-90f0-4e83-9d10-1c5b92c2bf0d': { label: '626', icon: '🟣' },
  '49cf4cfa-e783-4932-b14d-fa1be226111f': { label: '8th Court', icon: '🟡' },
  '80ae39a3-be84-47e8-bada-6c59c466bbef': { label: 'Blue Building', icon: '🔵' },
};

export default function CensusPage() {
  const [census, setCensus] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCensus();
    const interval = setInterval(loadCensus, 5 * 60 * 1000); // 5-minute refresh
    return () => clearInterval(interval);
  }, []);

  // --------------------------
  // Load Census from Supabase
  // --------------------------
  async function loadCensus() {
    setLoading(true);

    const { data, error } = await supabase
      .from('v_housing_grid_complete')
      .select(
        `
          bed_id,
          bed_label,
          is_occupied,
          resident_id,
          room_id,
          room_label,
          room_capacity,
          house_id,
          house_name,
          first_name,
          last_name
        `
      )
      .order('house_name', { ascending: true })
      .order('room_label', { ascending: true })
      .order('bed_label', { ascending: true });

    if (error) {
      console.error('Census load error:', error.message);
      setCensus([]);
      setLoading(false);
      return;
    }

    // For sanity-check while we’re stabilizing this
    console.log('Census rows loaded:', data?.length ?? 0);
    setCensus(data || []);
    setLoading(false);
  }

  // -----------------------------------
  // Group → House  → Room  → Beds list
  // -----------------------------------
  function groupByHouseRoom(rows) {
    const grouped = {};

    for (const row of rows) {
      const houseName = (row.house_name || 'Unknown House').trim();
      const roomLabel = row.room_label || 'Unknown Room';

      if (!grouped[houseName]) grouped[houseName] = {};
      if (!grouped[houseName][roomLabel]) grouped[houseName][roomLabel] = [];

      grouped[houseName][roomLabel].push(row);
    }

    return grouped;
  }

  const grouped = groupByHouseRoom(census);

  if (loading) {
    return (
      <div className="p-6 text-center text-gray-500">
        Loading housing census…
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-2xl font-semibold">Housing Census</h2>
      <p className="text-gray-600">
        Real-time occupancy by house, room, and bed.
      </p>

      {Object.entries(grouped).map(([houseName, rooms]) => {
        // Try to match a nickname using house_id embedded in the rows
        // Safe extraction of a sample row for house_id lookup
const firstRoom = Object.values(rooms)[0];
const sampleRow =
  Array.isArray(firstRoom) && firstRoom.length > 0
    ? firstRoom[0]
    : null;

const nickname =
  (sampleRow && HOUSE_NICKNAMES[sampleRow.house_id]) || {
    label: houseName,
    icon: '🏠',
  };

        const allBeds = Object.values(rooms).flat();
        const occupiedBeds = allBeds.filter(
          (b) => b.is_occupied === true || b.resident_id !== null
        ).length;
        const totalBeds = allBeds.length;
        const occupancyPct =
          totalBeds > 0
            ? Math.round((occupiedBeds / totalBeds) * 100)
            : 0;

        return (
          <Card key={houseName} className="p-4 border shadow-sm">
            {/* House header */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="flex items-center space-x-2 text-xl font-bold">
                <span>{nickname.icon}</span>
                <span>{nickname.label}</span>
              </h3>
              <div className="text-sm text-gray-500">
                {occupiedBeds}/{totalBeds} occupied ({occupancyPct}%)
              </div>
            </div>

            {/* Rooms */}
            {Object.entries(rooms).map(([roomLabel, beds]) => (
              <div key={roomLabel} className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold">{roomLabel}</h4>
                  <span className="text-xs text-gray-500">
                    {beds.length} beds
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  {beds.map((bed) => {
                    const occupied =
                      bed.is_occupied === true || bed.resident_id !== null;

                    const name = occupied
                      ? `${bed.first_name ?? ''} ${bed.last_name ?? ''}`.trim() ||
                        'Assigned'
                      : 'EMPTY';

                    return (
                      <Card
                        key={bed.bed_id}
                        className={`p-3 border ${
                          occupied ? 'bg-red-50' : 'bg-green-50'
                        }`}
                      >
                        <div className="font-medium">{bed.bed_label}</div>
                        <div className="mt-1 text-xs text-gray-600">
                          {name}
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </div>
            ))}
          </Card>
        );
      })}
    </div>
  );
}
