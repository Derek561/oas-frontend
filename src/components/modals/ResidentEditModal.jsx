"use client";

import { useEffect, useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

const supabase = createClientComponentClient();

const LOC_OPTIONS = [
  "PHP",
  "IOP 5-day",
  "IOP 3-day",
  "OP",
  "Halfway",
  "Unknown",
];

const GENDER_OPTIONS = ["Male", "Female"];

export default function ResidentEditModal({ resident, open, onClose, onSaved }) {
  // Resident fields
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [locLevel, setLocLevel] = useState("PHP");

  // Admission event fields
  const [uaLevel, setUaLevel] = useState("");
  const [bacLevel, setBacLevel] = useState("");
  const [ecNotes, setEcNotes] = useState("");
  const [notes, setNotes] = useState("");
  const [contactVerified, setContactVerified] = useState(false);

  // UI
  const [loading, setLoading] = useState(false);
  const [loadingEvent, setLoadingEvent] = useState(false);
  const [error, setError] = useState("");

  // Load resident + latest Intake event when modal opens
  useEffect(() => {
    if (!open || !resident) return;

    setFirstName(resident.first_name || "");
    setLastName(resident.last_name || "");
    setDob(resident.dob || "");
    setGender(resident.gender || "");
    setPhone(resident.phone || "");
    setEmail(resident.email || "");
    setLocLevel(resident.clinical_status || "PHP");

    const fetchIntakeEvent = async () => {
      setLoadingEvent(true);
      setError("");

      const { data, error: evtError } = await supabase
        .from("resident_events")
        .select(`
          id,
          ua_level,
          bac_level,
          notes,
          event_details,
          contact_verified
        `)
        .eq("resident_id", resident.id)
        .eq("event_type", "admission")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (evtError) {
        console.error("Error loading intake event:", evtError.message);
        setLoadingEvent(false);
        return;
      }

      if (data) {
        setUaLevel(data.ua_level || "");
        setBacLevel(data.bac_level || "");
        setEcNotes(data.event_details || "");
        setNotes(data.notes || "");
        setContactVerified(!!data.contact_verified);
      } else {
        setUaLevel("");
        setBacLevel("");
        setEcNotes("");
        setNotes("");
        setContactVerified(false);
      }

      setLoadingEvent(false);
    };

    fetchIntakeEvent();
  }, [open, resident]);

  if (!open || !resident) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // 1) Update core resident record
      const { error: updateError } = await supabase
        .from("residents")
        .update({
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          dob: dob || null,
          gender: gender || null,
          phone: phone.trim() || null,
          email: email.trim() || null,
          clinical_status: locLevel || "Unknown",
          updated_at: new Date().toISOString(),
        })
        .eq("id", resident.id);

      if (updateError) {
        console.error("Error updating resident:", updateError.message);
        setError("Unable to save changes. Please try again.");
        setLoading(false);
        return;
      }

      // 2) Upsert admission event (UA / BAC / EC / Notes)
      const { data: existingEvent, error: evtFetchError } = await supabase
        .from("resident_events")
        .select("id")
        .eq("resident_id", resident.id)
        .eq("event_type", "admission")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (evtFetchError) {
        console.error("Error loading admission event:", evtFetchError.message);
        // we *do not* hard-fail the resident update for this
      } else {
        const eventPayload = {
          resident_id: resident.id,
          event_type: "admission",
          ua_level: uaLevel || null,
          bac_level: bacLevel || null,
          event_details: ecNotes || null,        // ✅ SAVE EC NOTES CORRECTLY
          contact_verified: !!contactVerified,   // ✅ SAVE CHECKBOX
          notes: notes || null,
        };

        let evtUpsertError;

        if (existingEvent?.id) {
          const { error } = await supabase
            .from("resident_events")
            .update(eventPayload)
            .eq("id", existingEvent.id);
          evtUpsertError = error;
        } else {
          const { error } = await supabase
            .from("resident_events")
            .insert(eventPayload);
          evtUpsertError = error;
        }

        if (evtUpsertError) {
          console.error("Error saving admission event:", evtUpsertError.message);
          alert(
            `Resident core info saved, but UA/BAC/EC notes did NOT save: ${evtUpsertError.message}`
          );
          setLoading(false);
          return;
        }
      }

      alert("Resident updated.");
      if (onSaved) onSaved();   // ✅ LET PARENT REFRESH LIST
      if (onClose) onClose();
    } catch (err) {
      console.error("Unexpected error saving resident:", err);
      setError("Unexpected error saving changes.");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (loading) return;
    if (onClose) onClose();
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-2xl rounded-lg bg-white p-6 shadow-lg">
        <h2 className="mb-4 text-lg font-semibold">
          Edit Resident – {resident.last_name}, {resident.first_name}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Basic Info */}
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                First Name
              </label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="mt-1 w-full rounded border border-gray-300 p-2 text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Last Name
              </label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="mt-1 w-full rounded border border-gray-300 p-2 text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                DOB
              </label>
              <input
                type="date"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                className="mt-1 w-full rounded border border-gray-300 p-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Gender
              </label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="mt-1 w-full rounded border border-gray-300 p-2 text-sm"
              >
                <option value="">Select gender</option>
                {GENDER_OPTIONS.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Phone
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="mt-1 w-full rounded border border-gray-300 p-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full rounded border border-gray-300 p-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Level of Care (LOC)
              </label>
              <select
                value={locLevel}
                onChange={(e) => setLocLevel(e.target.value)}
                className="mt-1 w-full rounded border border-gray-300 p-2 text-sm"
              >
                {LOC_OPTIONS.map((loc) => (
                  <option key={loc} value={loc}>
                    {loc}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Clinical / Event Info */}
          <div className="rounded-md border border-gray-200 bg-gray-50 p-4">
            <h3 className="mb-2 text-sm font-semibold text-gray-700">
              Intake Clinical Details (UA / BAC / EC / Notes)
            </h3>
            {loadingEvent && (
              <p className="mb-2 text-xs text-gray-500">
                Loading prior intake event…
              </p>
            )}
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  UA Level / Result
                </label>
                <input
                  type="text"
                  value={uaLevel}
                  onChange={(e) => setUaLevel(e.target.value)}
                  className="mt-1 w-full rounded border border-gray-300 p-2 text-sm"
                  placeholder="e.g., Negative, THC+, EtG+, etc."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  BAC Result
                </label>
                <input
                  type="text"
                  value={bacLevel}
                  onChange={(e) => setBacLevel(e.target.value)}
                  className="mt-1 w-full rounded border border-gray-300 p-2 text-sm"
                  placeholder="e.g., 0.000, 0.030, refusal, etc."
                />
              </div>

              {/* EC Notified / Contact Notes */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700">
                  EC Notified / Contact Notes
                </label>
                <textarea
                  value={ecNotes}
                  onChange={(e) => setEcNotes(e.target.value)}
                  className="w-full rounded border-gray-300 p-2 text-sm"
                  rows={2}
                  placeholder="Who was contacted, when, and how (e.g., 'Mother notified at 20:15, left voicemail')."
                />
              </div>

              {/* EC Contact Verified Checkbox */}
              <div className="mt-2 flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={contactVerified}
                  onChange={(e) => setContactVerified(e.target.checked)}
                  className="h-4 w-4"
                />
                <label className="text-sm text-gray-700">
                  EC Contact Verified
                </label>
              </div>

              {/* Clinical / Shift Notes */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700">
                  Clinical / Shift Notes
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full rounded border-gray-300 p-2 text-sm"
                  rows={3}
                  placeholder="Additional intake notes, observations, or instructions."
                />
              </div>
            </div>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={handleCancel}
              className="rounded border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
              disabled={loading}
            >
              {loading ? "Saving…" : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
