"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function ResidentEventModal({ resident, onClose }) {
  const [uaResult, setUaResult] = useState("");
  const [bacResult, setBacResult] = useState("");
  const [ecNotes, setEcNotes] = useState("");
  const [notes, setNotes] = useState("");
  const [contactVerified, setContactVerified] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleSubmit() {
    setSaving(true);

    try {
      const payload = {
        resident_id: resident.id,
        house_id: resident.house_id,
        event_type: "admission",   // <-- intake event
        ua_result: uaResult || null,
        bac_result: bacResult || null,
        ec_notes: ecNotes || null,
        notes: notes || null,
        contact_verified: !!contactVerified,

        // Internal narrative / metadata
        event_details: "Initial Admission / Intake",
        narrative: null,
        discharge_reason: null,
        discharge_type: null,

        // Staff fields (wire later when auth is set)
        actor: null,
        created_by: null,
        submitted_by: null,
      };

      const { error } = await supabase
        .from("resident_events")
        .insert(payload);

      if (error) throw error;

      alert("✅ Intake event recorded.");
      onClose();
    } catch (err) {
      alert(`⚠️ ${err.message}`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center">
      <div className="bg-white p-6 rounded-lg w-[400px] shadow">
        <h2 className="text-xl font-semibold mb-4">Resident Intake Details</h2>

        {/* EC Verified */}
        <label className="block mb-2">
          <input
            type="checkbox"
            checked={contactVerified}
            onChange={(e) => setContactVerified(e.target.checked)}
            className="mr-2"
          />
          Emergency Contact Verified
        </label>

        {/* UA */}
        <input
          placeholder="UA Result"
          value={uaResult}
          onChange={(e) => setUaResult(e.target.value)}
          className="border w-full p-2 mb-2 rounded"
        />

        {/* BAC */}
        <input
          placeholder="BAC Result"
          value={bacResult}
          onChange={(e) => setBacResult(e.target.value)}
          className="border w-full p-2 mb-2 rounded"
        />

        {/* EC Notes */}
        <textarea
          placeholder="EC Notes (notifications, attempts, outcomes)"
          value={ecNotes}
          onChange={(e) => setEcNotes(e.target.value)}
          className="border w-full p-2 mb-2 rounded"
          rows={2}
        />

        {/* Intake Notes */}
        <textarea
          placeholder="Clinical / shift intake notes..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="border w-full p-2 mb-3 rounded"
          rows={3}
        />

        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="border px-3 py-1 rounded"
            disabled={saving}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="bg-blue-600 text-white px-3 py-1 rounded"
          >
            {saving ? "Saving..." : "Save Intake"}
          </button>
        </div>
      </div>
    </div>
  );
}
