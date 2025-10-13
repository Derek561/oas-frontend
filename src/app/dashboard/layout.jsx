'use client';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';

export default function DashboardLayout({ children }) {
  const router = useRouter();

  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) router.push('/login');
    });
    return () => listener.subscription.unsubscribe();
  }, [router]);

  return (
    <div className="flex min-h-screen bg-gray-100">
      <aside className="w-64 bg-slate-800 text-white flex flex-col p-4">
        <h2 className="text-xl font-bold mb-6">MVP Dashboard</h2>
        <nav className="space-y-2">
          <a href="/dashboard" className="block p-2 rounded hover:bg-slate-700">Dashboard</a>
          <a href="/clients" className="block p-2 rounded hover:bg-slate-700">Clients</a>
          <a href="/census" className="block p-2 rounded hover:bg-slate-700">Census</a>
          <a href="/shiftlogs" className="block p-2 rounded hover:bg-slate-700">Shift Logs</a>
          <a href="/behavior" className="block p-2 rounded hover:bg-slate-700">Behavior Notes</a>
          <a href="/maintenance" className="block p-2 rounded hover:bg-slate-700">Maintenance</a>
        </nav>
      </aside>

      <main className="flex-1 p-8">
        {children}
      </main>
    </div>
  );
}
