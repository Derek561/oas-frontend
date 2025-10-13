'use client';
import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '../utils/supabaseClient';

export default function DashboardLayout({ children }) {
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-800 text-white flex flex-col">
        <div className="p-4 text-2xl font-bold border-b border-gray-700">
          OHS Dashboard
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <Link href="/dashboard" className="block p-2 rounded hover:bg-gray-700">
            Home
          </Link>
          <Link href="/dashboard/clients" className="block p-2 rounded hover:bg-gray-700">
            Clients
          </Link>
          <Link href="/dashboard/census" className="block p-2 rounded hover:bg-gray-700">
            Census
          </Link>
          <Link href="/dashboard/reports" className="block p-2 rounded hover:bg-gray-700">
            Reports
          </Link>
        </nav>
        <button
          onClick={handleLogout}
          className="m-4 bg-red-500 hover:bg-red-600 p-2 rounded"
        >
          Logout
        </button>
      </aside>

      {/* Main content */}
      <main className="flex-1 bg-gray-100 p-6">{children}</main>
    </div>
  );
}
