// src/app/dashboard/layout.js
// ───────────────────────────────────────────────
// TRUTH BUILD: Forces runtime rendering globally
// Prevents static prerender failures on Netlify
// ───────────────────────────────────────────────

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function DashboardLayout({ children }) {
  return (
    <main className="min-h-screen bg-gray-50 text-gray-900">
      <div className="max-w-6xl mx-auto px-6 py-10">{children}</div>
    </main>
  );
}
