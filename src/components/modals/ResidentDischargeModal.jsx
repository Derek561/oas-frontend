"use client";

import { useEffect, useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

const supabase = createClientComponentClient();

/**
 * @param {{ resident: any, open: boolean, onClose: () => void, onSaved: () => void }} props
 */
export default function ResidentDischargeModal({
  resident,
  open,
  onClose,
  onSaved,
}) {
  const [dischargeDate, setDischargeDate] = useState("");
  const [dischargeType, setDischargeType] = useState("");
  const [dischargeReason, setDischargeReason] = useState("");
  const [narrative, setNarrative] = useState("");
  const [ecNotes, setEcNotes] = useState("");
  const [contactVerified, setContactVerified] = useState(false);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!resident || !open) return;
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    setDischargeDate(`${yyyy}-${mm}-${dd}`);
    setDischargeType("");
    setDischargeReason("");
    setNarrative("");
    setEcNotes("");
    setContactVerified(false);
    setNotes("");
  }, [resident, open]);

  if (!open || !resident) return null;

  async function handleSubmit(e) {
    e.preventDefault();

    if (!dischargeDate) {
      alert("Discharge date is required.");
      return;
    }

    if (!dischargeType) {
      alert("Discharge type is required.");
      return;
    }

    setSaving(true);

    try {
      // 1. Update resident record as discharged
      const { error: updateError } = await supabase
        .from("residents")
        .update({
          status: "Discharged",
          clinical_status: resident.clinical_status || "Unknown",
          discharge_date: dischargeDate,
          is_active: false,
          discharged_at: new Date().toISOString(),
          // keep house/room/bed for historical record; do NOT clear house_id
        })
        .eq("id", resident.id);

      if (updateError) {
        console.error("Discharge resident error:", updateError.message);
        alert("Unable to discharge resident.");
        setSaving(false);
        return;
      }

      // 2. Free bed if currently assigned
      if (resident.bed_id) {
        const { error: bedError } = await supabase
          .from("beds")
          .update({
            is_occupied: false,
            occupied_by: null,
          })
          .eq("id", resident.bed_id);

        if (bedError) {
          console.error("Free bed on discharge error:", bedError.message);
          // Not fatal to the discharge event, but log it.
        }
      }

      // 3. Insert discharge event into resident_events
      const dischargeEvent = {
        resident_id: resident.id,
        house_id: resident.house_id || null,
        event_type: "discharge",
        discharge_type: dischargeType || null,
        discharge_reason: dischargeReason || null,
        narrative: narrative || null,
        notes: notes || null,
        ec_notes: ecNotes || null,
        contact_verified: !!contactVerified,
        event_details: `Discharge recorded (${dischargeType || "unspecified"})`,
        // staff metadata currently not wired; left null
        actor: null,
        created_by: null,
        submitted_by: null,
        ua_result: null,
        bac_result: null,
      };

      const { error: evtError } = await supabase
        .from("resident_events")
        .insert(dischargeEvent);

      if (evtError) {
        console.error("Insert discharge event error:", evtError.message);
        alert(
          `Resident marked as discharged, but the discharge event did NOT save: ${evtError.message}`
        );
        setSaving(false);
        // still refresh list so at least status updates
        onSaved && onSaved();
        onClose && onClose();
        return;
      }

      alert("Resident discharged.");
      onSaved && onSaved();
      onClose && onClose();
    } catch (err) {
      console.error("Unexpected discharge error:", err);
      alert("Unexpected error discharging resident.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-xl rounded-lg bg-white p-6 shadow-lg">
        <h3 className="mb-4 text-lg font-semibold">
          Discharge {resident.last_name}, {resident.first_name}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Discharge Date
              </label>
              <input
                type="date"
                value={dischargeDate}
                onChange={(e) => setDischargeDate(e.target.value)}
                className="mt-1 w-full rounded border border-gray-300 p-2 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Discharge Type
              </label>
              <select
                value={dischargeType}
                onChange={(e) => setDischargeType(e.target.value)}
                className="mt-1 w-full rounded border border-gray-300 p-2 text-sm"
              >
                <option value="">Select type</option>
                <option value="Clinical">Clinical Discharge</option>
                <option value="AMA">Against Medical Advice (AMA)</option>
                <option value="Administrative">Administrative</option>
                <option value="Left Early">Left Early</option>
                <option value="Transfer">Transfer to Higher/Lower Level</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Discharge Reason (short)
            </label>
            <input
              type="text"
              value={dischargeReason}
              onChange={(e) => setDischargeReason(e.target.value)}
              className="mt-1 w-full rounded border border-gray-300 p-2 text-sm"
              placeholder="e.g., Completed program, non-compliance, legal issues, etc."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Discharge Narrative (clinical / case management)
            </label>
            <textarea
              value={narrative}
              onChange={(e) => setNarrative(e.target.value)}
              className="mt-1 w-full rounded border border-gray-300 p-2 text-sm"
              rows={4}
              placeholder="Summarize circumstances, interventions, and recommendations at discharge."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              EC Notes (notifications, attempts, outcomes)
            </label>
            <textarea
              value={ecNotes}
              onChange={(e) => setEcNotes(e.target.value)}
              className="mt-1 w-full rounded border border-gray-300 p-2 text-sm"
              rows={3}
              placeholder="Who was contacted, when, and what was communicated about discharge."
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              id="ec-verified"
              type="checkbox"
              checked={contactVerified}
              onChange={(e) => setContactVerified(e.target.checked)}
              className="h-4 w-4"
            />
            <label
              htmlFor="ec-verified"
              className="text-sm font-medium text-gray-700"
            >
              Emergency Contact contact verified
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Additional Notes (Shift / Case Management)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="mt-1 w-full rounded border border-gray-300 p-2 text-sm"
              rows={3}
              placeholder="Any additional notes relevant to internal review, QA, or re-admission."
            />
          </div>

          <div className="mt-4 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
            >
              {saving ? "Saving…" : "Confirm Discharge"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
