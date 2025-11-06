"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function ResidentEventModal({ resident, onClose }) {
  const [uaLevel, setUaLevel] = useState("");
  const [bacLevel, setBacLevel] = useState("");
  const [notes, setNotes] = useState("");
  const [contactVerified, setContactVerified] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleSubmit() {
    setSaving(true);
    try {
      const { error } = await supabase.from("resident_events").insert([
        {
          resident_id: resident.id,
          house_id: resident.house_id,
          event_type: "admission",
          ua_level: uaLevel,
          bac_level: bacLevel,
          notes,
          contact_verified: contactVerified,
        },
      ]);
      if (error) throw error;
      alert("✅ Intake recorded.");
      onClose();
    } catch (err) {
      alert(`⚠️ ${err.message}`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center">
      <div className="bg-white p-6 rounded-lg w-[400px]">
        <h2 className="text-xl font-semibold mb-4">Resident Intake Details</h2>
        <label className="block mb-2"><input type="checkbox" checked={contactVerified} onChange={(e) => setContactVerified(e.target.checked)} /> Emergency Contact Verified</label>
        <input placeholder="UA result" value={uaLevel} onChange={(e) => setUaLevel(e.target.value)} className="border w-full p-2 mb-2 rounded" />
        <input placeholder="BAC result" value={bacLevel} onChange={(e) => setBacLevel(e.target.value)} className="border w-full p-2 mb-2 rounded" />
        <textarea placeholder="Intake notes..." value={notes} onChange={(e) => setNotes(e.target.value)} className="border w-full p-2 mb-3 rounded" />
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="border px-3 py-1 rounded">Cancel</button>
          <button onClick={handleSubmit} disabled={saving} className="bg-blue-600 text-white px-3 py-1 rounded">{saving ? "Saving..." : "Save Intake"}</button>
        </div>
      </div>
    </div>
  );
}
