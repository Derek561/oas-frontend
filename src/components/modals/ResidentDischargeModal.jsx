"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function ResidentDischargeModal({ resident, onClose }) {
  const [reason, setReason] = useState("With Staff Approval (WSA)");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit() {
    setSaving(true);
    try {
      // Record discharge event
      const { error: eventError } = await supabase.from("resident_events").insert([
        {
          resident_id: resident.id,
          house_id: resident.house_id,
          event_type: "discharge",
          discharge_reason: reason,
          notes,
        },
      ]);
      if (eventError) throw eventError;

      // Update main resident status
      const { error: updateError } = await supabase.from("residents").update({
        status: "Discharged",
        discharge_date: new Date().toISOString().split("T")[0],
      }).eq("id", resident.id);
      if (updateError) throw updateError;

      alert("✅ Discharge recorded.");
      onClose();
    } catch (err) {
      console.error("Discharge submission failed:", err.message);
      alert(`⚠️ Error: ${err.message}`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center">
      <div className="bg-white p-6 rounded-lg w-[400px]">
        <h2 className="text-xl font-semibold mb-4">Resident Discharge Details</h2>
        <select value={reason} onChange={(e) => setReason(e.target.value)} className="border w-full p-2 mb-2 rounded">
          <option>With Staff Approval (WSA)</option>
          <option>Against Staff Advice (ASA)</option>
          <option>Administrative Discharge (AD)</option>
        </select>
        <textarea placeholder="Discharge notes..." value={notes} onChange={(e) => setNotes(e.target.value)} className="border w-full p-2 mb-3 rounded" />
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="border px-3 py-1 rounded">Cancel</button>
          <button onClick={handleSubmit} disabled={saving} className="bg-blue-600 text-white px-3 py-1 rounded">{saving ? "Saving..." : "Save Discharge"}</button>
        </div>
      </div>
    </div>
  );
}
