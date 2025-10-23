"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { getActiveStaff } from "@/lib/getActiveStaff";
import NewResidentForm from "./NewResidentForm";
import ResidentModal from "./ResidentModal"; // 👈 NEW IMPORT

export default function ClientsPage() {
  const [residents, setResidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedResident, setSelectedResident] = useState(null); // 👈 NEW STATE
  const router = useRouter();

  // Session check
  useEffect(() => {
    const staff = getActiveStaff();
    if (!staff) router.push("/login");
  }, [router]);

  const fetchResidents = async () => {
    try {
      const { data, error } = await supabase
        .from("residents")
        .select(
          "id, first_name, last_name, admission_date, discharge_date, status"
        )
        .order("admission_date", { ascending: false });

      if (error) throw error;
      setResidents(data || []);
    } catch (err) {
      console.error("Error fetching residents:", err);
      setError("Failed to load resident data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResidents();
  }, []);

  useEffect(() => {
    const channel = supabase
      .channel("residents-changes")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "residents" },
        (payload) => {
          setResidents((prev) => [payload.new, ...prev]);
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "residents" },
        (payload) => {
          setResidents((prev) =>
            prev.map((r) => (r.id === payload.new.id ? payload.new : r))
          );
        }
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "residents" },
        (payload) => {
          setResidents((prev) => prev.filter((r) => r.id !== payload.old.id));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-screen text-gray-600">
        Loading residents...
      </div>
    );

  if (error)
    return (
      <div className="flex items-center justify-center min-h-screen text-red-600">
        {error}
      </div>
    );

  return (
    <div className="max-w-6xl mx-auto bg-white rounded-lg shadow p-6 mt-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-semibold text-gray-800">Residents</h1>
      </div>

      <NewResidentForm onResidentAdded={fetchResidents} />

      {residents.length === 0 ? (
        <p className="text-gray-600">No residents found.</p>
      ) : (
        <table className="w-full text-left border border-gray-200">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2 border-b">Name</th>
              <th className="p-2 border-b">Admission Date</th>
              <th className="p-2 border-b">Discharge Date</th>
              <th className="p-2 border-b">Status</th>
              <th className="p-2 border-b">Actions</th>
            </tr>
          </thead>
          <tbody>
            {residents.map((r) => (
              <tr key={r.id} className="hover:bg-gray-50">
                <td className="p-2 border-b">
                  {r.first_name} {r.last_name}
                </td>
                <td className="p-2 border-b">
                  {r.admission_date
                    ? new Date(r.admission_date).toLocaleDateString()
                    : "N/A"}
                </td>
                <td className="p-2 border-b">
                  {r.discharge_date
                    ? new Date(r.discharge_date).toLocaleDateString()
                    : "—"}
                </td>
                <td className="p-2 border-b">{r.status || "Unknown"}</td>
                <td className="p-2 border-b">
                  <button
                    onClick={() => setSelectedResident(r)}
                    className="text-blue-600 hover:underline"
                  >
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Modal Render */}
      {selectedResident && (
        <ResidentModal
          resident={selectedResident}
          onClose={() => setSelectedResident(null)}
          onSaved={() => {
            setSelectedResident(null);
            fetchResidents();
          }}
          onDeleted={() => {
            setSelectedResident(null);
            fetchResidents();
          }}
        />
      )}
    </div>
  );
}
