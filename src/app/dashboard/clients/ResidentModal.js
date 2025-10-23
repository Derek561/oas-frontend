"use client";

import { useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { addAuditLog } from "@/lib/addAuditLog"; // ✅ new helper

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function ResidentModal({ resident, onClose, onSaved, onDeleted }) {
  const [formData, setFormData] = useState({
    first_name: resident.first_name || "",
    last_name: resident.last_name || "",
    admission_date: resident.admission_date?.split("T")[0] || "",
    discharge_date: resident.discharge_date?.split("T")[0] || "",
    status: resident.status || "Active",
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const handleChange = (e) =>
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  // 🔹 Update resident
  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      alert("No active session — please log in again.");
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("residents")
      .update({
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        admission_date: formData.admission_date,
        discharge_date: formData.discharge_date || null,
        status: formData.status,
      })
      .eq("id", resident.id)
      .select();

    setLoading(false);

    if (error) {
      console.error("Update Error:", error);
      setMessage(`❌ ${error.message}`);
    } else {
      setMessage("✅ Resident updated successfully!");
      // 🧾 Log this update
      await addAuditLog("Resident Updated", "residents", resident.id, formData);
      onSaved();
    }
  };

  // 🔹 Delete resident
  const handleDelete = async () => {
    if (!confirm(`Delete ${resident.first_name}?`)) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      alert("No active session — please log in again.");
      return;
    }

    const { error } = await supabase.from("residents").delete().eq("id", resident.id);

    if (error) {
      console.error("Delete Error:", error);
      setMessage(`❌ ${error.message}`);
    } else {
      setMessage("🗑 Resident deleted successfully!");
      // 🧾 Log this delete
      await addAuditLog("Resident Deleted", "residents", resident.id);
      onDeleted();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-800"
        >
          ✖
        </button>

        <h2 className="text-xl font-semibold mb-4">Edit Resident</h2>

        <form onSubmit={handleUpdate} className="space-y-3">
          <div className="flex gap-3">
            <input
              name="first_name"
              value={formData.first_name}
              onChange={handleChange}
              placeholder="First Name"
              className="border p-2 rounded w-1/2"
              required
            />
            <input
              name="last_name"
              value={formData.last_name}
              onChange={handleChange}
              placeholder="Last Name"
              className="border p-2 rounded w-1/2"
              required
            />
          </div>

          <div className="flex gap-3">
            <input
              type="date"
              name="admission_date"
              value={formData.admission_date}
              onChange={handleChange}
              className="border p-2 rounded w-1/2"
              required
            />
            <input
              type="date"
              name="discharge_date"
              value={formData.discharge_date}
              onChange={handleChange}
              className="border p-2 rounded w-1/2"
            />
          </div>

          <select
            name="status"
            value={formData.status}
            onChange={handleChange}
            className="border p-2 rounded w-full"
          >
            <option>Active</option>
            <option>Discharged</option>
            <option>Pending</option>
          </select>

          <div className="flex justify-between pt-3">
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              {loading ? "Saving..." : "Save Changes"}
            </button>
            <button
              type="button"
              onClick={handleDelete}
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
            >
              Delete
            </button>
          </div>
        </form>

        {message && <p className="mt-3 text-sm text-center">{message}</p>}
      </div>
    </div>
  );
}
