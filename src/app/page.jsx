"use client";
import Link from "next/link";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
        <h1 className="text-3xl font-bold mb-4 text-gray-800">
          Oceanside Housing Portal
        </h1>
        <p className="text-gray-600 mb-6">
          Secure access to your resident and operations dashboard.
        </p>

        <Link
          href="/login"
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2 rounded-lg transition-all duration-200"
        >
          Sign In
        </Link>

        <p className="text-xs text-gray-400 mt-6">
          © {new Date().getFullYear()} Oceanside Housing LLC. All rights reserved.
        </p>
      </div>
    </main>
  );
}
