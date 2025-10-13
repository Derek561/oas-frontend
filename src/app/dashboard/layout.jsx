'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../utils/supabaseClient';

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const getUser = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error || !data?.user) {
        router.push('/login');
      } else {
        setUser(data.user);
      }
    };

    getUser();
  }, [router]);

  if (!user) {
    return (
      <div className="flex h-screen justify-center items-center text-gray-700">
        Loading...
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-semibold mb-4">Welcome back, {user.email}</h1>
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white shadow rounded p-4">
          <h2 className="text-lg font-bold">House Census</h2>
          <p>View capacity and occupancy across all houses.</p>
        </div>
        <div className="bg-white shadow rounded p-4">
          <h2 className="text-lg font-bold">Room Census</h2>
          <p>Drill down into individual rooms, capacity, and availability.</p>
        </div>
        <div className="bg-white shadow rounded p-4">
          <h2 className="text-lg font-bold">Enrollment Roster</h2>
          <p>See which clients are admitted, where they’re placed, and their status.</p>
        </div>
      </div>
    </div>
  );
}
