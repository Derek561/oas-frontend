'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../utils/supabaseClient';
import { useRouter } from 'next/navigation';

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);

  useEffect(() => {
    async function getUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) router.push('/login');
      else setUser(user);
    }
    getUser();
  }, [router]);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push('/login');
  }

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col">
      <nav className="bg-blue-800 text-white p-4 flex justify-between items-center shadow-md">
        <h1 className="text-lg font-semibold">Oceanside Housing Systems</h1>
        <button
          onClick={handleLogout}
          className="bg-white text-blue-800 px-4 py-2 rounded hover:bg-gray-200 transition"
        >
          Logout
        </button>
      </nav>

      <div className="flex-1 flex flex-col items-center justify-center p-10 text-center">
        <h2 className="text-2xl font-semibold mb-8">Welcome, {user?.email || 'User'} 👋</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl">
          <Card title="🏠 House Census" description="View capacity and occupancy across all houses." link="#" />
          <Card title="📋 Room Census" description="Drill down into individual rooms, capacity, and availability." link="#" />
          <Card title="🧾 Enrollment Roster" description="See which clients are admitted, where they’re placed, and their current status." link="#" />
        </div>
      </div>
    </main>
  );
}

function Card({ title, description, link }) {
  return (
    <a href={link} className="bg-white shadow-md hover:shadow-lg rounded-xl p-6 transition border border-gray-200">
      <h3 className="text-xl font-bold mb-2 text-blue-700">{title}</h3>
      <p className="text-gray-600 text-sm">{description}</p>
    </a>
  );
}
