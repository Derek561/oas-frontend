"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import ResidentHistory from "@/components/ResidentHistory";

export default function ResidentHistoryPage({ params }) {
  const p = use(params);
  const router = useRouter();

  return (
    <div className="px-6 py-6">
      {/* Back Button */}
      <button
        onClick={() => router.push("/dashboard/residents")}
        className="mb-4 inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
      >
        ← Back to Residents
      </button>

      <ResidentHistory residentId={p.id} />
    </div>
  );
}
