'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../utils/supabaseClient';

export default function DashboardPage() {
  const [user, setUser] = useState(null);
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data?.user) router.push('/login');
      else setUser(data.user);
    });
  }, [router]);

  if (!user) return <p className="text-center mt-10 text-gray-500">Loading dashboard...</p>;

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8 text-slate-800">Oceanside Housing Systems</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="p-6 bg-white rounded-xl shadow hover:shadow-lg transition">
          <h2 className="text-xl font-semibold mb-2">🏠 House Census</h2>
          <p className="text-gray-600">View capacity and occupancy across all houses.</p>
        </div>
        <div className="p-6 bg-white rounded-xl shadow hover:shadow-lg transition">
          <h2 className="text-xl font-semibold mb-2">🛏️ Room Census</h2>
          <p className="text-gray-600">Drill into individual rooms, capacity, and availability.</p>
        </div>
        <div className="p-6 bg-white rounded-xl shadow hover:shadow-lg transition">
          <h2 className="text-xl font-semibold mb-2">📋 Enrollment Roster</h2>
          <p className="text-gray-600">See which clients are admitted, where they’re placed, and their status.</p>
        </div>
      </div>
    </div>
  );
}
