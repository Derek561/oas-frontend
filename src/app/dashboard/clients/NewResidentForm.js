"use client";

import { useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function NewResidentForm({ onResidentAdded }) {
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    admission_date: "",
    status: "Active",
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const { data, error } = await supabase
      .from("residents")
      .insert([
        {
          first_name: formData.first_name.trim(),
          last_name: formData.last_name.trim(),
          admission_date: formData.admission_date,
          status: formData.status,
        },
      ])
      .select();

    setLoading(false);

    if (error) {
      console.error("Insert Error:", error);
      setMessage(`❌ Error: ${error.message}`);
    } else {
      setMessage("✅ Resident added successfully!");
      setFormData({
        first_name: "",
        last_name: "",
        admission_date: "",
        status: "Active",
      });
      if (onResidentAdded) onResidentAdded(data[0]); // callback to refresh dashboard
    }
  };

  return (
    <div className="bg-white shadow-md rounded-2xl p-4 mb-6">
      <h2 className="text-xl font-semibold mb-4">➕ Add New Resident</h2>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="flex gap-3">
          <input
            type="text"
            name="first_name"
            placeholder="First Name"
            value={formData.first_name}
            onChange={handleChange}
            className="border p-2 rounded w-1/2"
            required
          />
          <input
            type="text"
            name="last_name"
            placeholder="Last Name"
            value={formData.last_name}
            onChange={handleChange}
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
          <select
            name="status"
            value={formData.status}
            onChange={handleChange}
            className="border p-2 rounded w-1/2"
          >
            <option>Active</option>
            <option>Discharged</option>
            <option>Pending</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          {loading ? "Adding..." : "Add Resident"}
        </button>
      </form>

      {message && <p className="mt-3 text-sm">{message}</p>}
    </div>
  );
}
