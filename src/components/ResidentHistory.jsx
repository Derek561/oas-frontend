"use client";

import { useEffect, useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

const supabase = createClientComponentClient();

function formatDateTime(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;

  return `${d.toLocaleDateString()} ${d
    .toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    .toLowerCase()}`;
}

function formatDate(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString();
}

function eventLabel(event) {
  const type = (event.event_type || "").toLowerCase();

  switch (type) {
    case "admission":
      return "Admission";
    case "discharge":
      return "Discharge";
    case "level_change":
      return "Level of Care Change";
    case "housing_change":
      return "Housing / Bed Change";
    case "shift_note":
      return "Shift Note";
    case "ua":
      return "UA Result";
    case "bac":
      return "BAC Result";
    default:
      return event.event_type || "Event";
  }
}

function eventBadgeClass(event) {
  const type = (event.event_type || "").toLowerCase();

  switch (type) {
    case "admission":
      return "bg-green-100 text-green-700 border-green-200";
    case "discharge":
      return "bg-red-100 text-red-700 border-red-200";
    case "level_change":
    case "housing_change":
      return "bg-blue-100 text-blue-700 border-blue-200";
    case "shift_note":
      return "bg-purple-100 text-purple-700 border-purple-200";
    default:
      return "bg-gray-100 text-gray-700 border-gray-200";
  }
}

export default function ResidentHistory({ residentId }) {
  const [resident, setResident] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!residentId) return;

    let isMounted = true;

    async function loadHistory() {
      setLoading(true);
      setError("");

      try {
        // 1) Load resident core info
        const {
          data: residentData,
          error: residentError,
        } = await supabase
          .from("residents")
          .select(
            `
            id,
            first_name,
            last_name,
            clinical_status,
            admission_date
          `
          )
          .eq("id", residentId)
          .maybeSingle();

        if (residentError) {
          console.error("Error loading resident:", residentError.message);
          if (isMounted)
            setError("Unable to load resident details for history view.");
        } else if (isMounted) {
          setResident(residentData || null);
        }

        // 2) Load all events for this resident (timeline)
        const {
          data: eventsData,
          error: eventsError,
        } = await supabase
          .from("resident_events")
          .select(
            `
            id,
            resident_id,
            house_id,
            event_type,
            actor,
            created_at,
            event_details,
            contact_verified,
            discharge_reason,
            submitted_by,
            notes,
            created_by,
            discharge_type,
            ec_notes,
            narrative,
            ua_result,
            bac_result
          `
          )
          .eq("resident_id", residentId)
          .order("created_at", { ascending: false });

        if (eventsError) {
          console.error("Error loading events:", eventsError.message);
          if (isMounted)
            setError(
              "Unable to load resident history events for this client."
            );
        } else if (isMounted) {
          setEvents(eventsData || []);
        }
      } catch (err) {
        console.error("Unexpected error loading history:", err);
        if (isMounted)
          setError("Unexpected error loading resident history timeline.");
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadHistory();

    return () => {
      isMounted = false;
    };
  }, [residentId]);

  const fullName = resident
    ? `${resident.last_name || ""}, ${resident.first_name || ""}`.trim()
    : "";

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      {/* Header */}
      <div className="mb-6 border-b border-gray-200 pb-4">
        <h1 className="text-2xl font-semibold text-gray-900">
          Resident History
        </h1>
        {resident && (
          <p className="mt-1 text-sm text-gray-600">
            {fullName && <span className="font-medium">{fullName}</span>}
            {resident.clinical_status && (
              <>
                {" "}
                • LOC:{" "}
                <span className="font-medium">
                  {resident.clinical_status}
                </span>
              </>
            )}
            {resident.admission_date && (
              <>
                {" "}
                • Admitted:{" "}
                <span>{formatDate(resident.admission_date)}</span>
              </>
            )}
          </p>
        )}
        <p className="mt-1 text-xs text-gray-400">
          Internal timeline of all admission, discharge, UA/BAC, housing,
          level-of-care, and shift-note events for auditing and re-admission
          reference.
        </p>
      </div>

      {/* States */}
      {loading && (
        <div className="rounded-md border border-gray-200 bg-white p-4 text-sm text-gray-600">
          Loading resident history…
        </div>
      )}

      {!loading && error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {!loading && !error && events.length === 0 && (
        <div className="rounded-md border border-gray-200 bg-white p-4 text-sm text-gray-600">
          No history events found for this resident yet. Events will appear here
          as admissions, discharges, UA/BAC entries, housing changes, level of
          care updates, and shift notes are recorded.
        </div>
      )}

      {/* Timeline */}
      {!loading && !error && events.length > 0 && (
        <div className="relative">
          {/* Vertical timeline line */}
          <div className="pointer-events-none absolute left-4 top-0 h-full w-px bg-gray-200 md:left-6" />

          <ul className="space-y-4">
            {events.map((event) => {
              const badgeClass = eventBadgeClass(event);
              const label = eventLabel(event);

              const staffName =
                event.actor ||
                event.created_by ||
                event.submitted_by ||
                "Staff (not recorded)";

              const hasUa = !!event.ua_result;
              const hasBac = !!event.bac_result;
              const hasEc = !!event.ec_notes || !!event.event_details;
              const hasNotes = !!event.notes;
              const hasNarrative = !!event.narrative;
              const isDischarge =
                (event.event_type || "").toLowerCase() === "discharge";

              return (
                <li key={event.id} className="relative pl-10 md:pl-14">
                  {/* Dot */}
                  <span className="absolute left-3 top-3 flex h-3 w-3 items-center justify-center md:left-5">
                    <span className="h-3 w-3 rounded-full bg-blue-500 ring-2 ring-white" />
                  </span>

                  <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${badgeClass}`}
                        >
                          {label}
                        </span>
                        <span className="text-xs text-gray-500">
                          {formatDateTime(event.created_at)}
                        </span>
                      </div>
                      <span className="text-xs text-gray-500">
                        Entered by:{" "}
                        <span className="font-medium text-gray-700">
                          {staffName}
                        </span>
                      </span>
                    </div>

                    {/* Details block */}
                    {(hasUa ||
                      hasBac ||
                      hasEc ||
                      hasNotes ||
                      hasNarrative ||
                      isDischarge) && (
                      <div className="mt-3 space-y-1 text-sm text-gray-700">
                        {hasUa && (
                          <p>
                            <span className="font-medium">UA Result:</span>{" "}
                            {event.ua_result}
                          </p>
                        )}
                        {hasBac && (
                          <p>
                            <span className="font-medium">BAC Result:</span>{" "}
                            {event.bac_result}
                          </p>
                        )}
                        {hasEc && (
                          <p>
                            <span className="font-medium">
                              EC / Contact Notes:
                            </span>{" "}
                            {event.ec_notes || event.event_details}
                          </p>
                        )}
                        {event.contact_verified !== null &&
                          event.contact_verified !== undefined && (
                            <p>
                              <span className="font-medium">
                                EC Contact Verified:
                              </span>{" "}
                              {event.contact_verified ? "Yes" : "No"}
                            </p>
                          )}

                        {isDischarge && (
                          <>
                            {event.discharge_type && (
                              <p>
                                <span className="font-medium">
                                  Discharge Type:
                                </span>{" "}
                                {event.discharge_type}
                              </p>
                            )}
                            {event.discharge_reason && (
                              <p>
                                <span className="font-medium">
                                  Discharge Reason:
                                </span>{" "}
                                {event.discharge_reason}
                              </p>
                            )}
                          </>
                        )}

                        {hasNarrative && (
                          <p className="whitespace-pre-wrap">
                            <span className="font-medium">Narrative:</span>{" "}
                            {event.narrative}
                          </p>
                        )}

                        {hasNotes && (
                          <p className="whitespace-pre-wrap">
                            <span className="font-medium">Notes:</span>{" "}
                            {event.notes}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
