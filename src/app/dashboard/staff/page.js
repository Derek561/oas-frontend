"use client";

import { useEffect, useState } from "react";
import { CRUD } from "@/lib/supabaseCRUD";
import StaffModal from "./StaffModal";

export default function StaffPage() {
  const [staff, setStaff] = useState([]);
  const [selected, setSelected] = useState(null);

  const loadStaff = async () => {
    const data = await CRUD.read("staff");
    setStaff(data);
  };

  useEffect(() => {
    loadStaff();
  }, []);

  return (
    <div className="max-w-6xl mx-auto bg-white rounded-lg shadow p-6 mt-6">
      <div className="flex justify-between mb-4">
        <h1 className="text-xl font-semibold">Staff</h1>
        <button
          onClick={() => setSelected({})}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          + Add Staff
        </button>
      </div>

      {staff.length === 0 ? (
        <p>No staff found.</p>
      ) : (
        <table className="w-full border text-left">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2 border-b">Name</th>
              <th className="p-2 border-b">Role</th>
              <th className="p-2 border-b">Email</th>
              <th className="p-2 border-b">Actions</th>
            </tr>
          </thead>
          <tbody>
            {staff.map((s) => (
              <tr key={s.id} className="hover:bg-gray-50">
                <td className="p-2 border-b">{s.name}</td>
                <td className="p-2 border-b">{s.role}</td>
                <td className="p-2 border-b">{s.email}</td>
                <td className="p-2 border-b">
                  <button
                    onClick={() => setSelected(s)}
                    className="text-blue-600 hover:underline"
                  >
                    Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {selected && (
        <StaffModal
          staff={selected}
          onClose={() => setSelected(null)}
          onSaved={() => {
            setSelected(null);
            loadStaff();
          }}
        />
      )}
    </div>
  );
}
