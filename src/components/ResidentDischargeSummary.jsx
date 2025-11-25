"use client";

import { useEffect, useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { format } from "date-fns";

const supabase = createClientComponentClient();

export default function ResidentDischargeSummary({ residentId }) {
  const [resident, setResident] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!residentId) return;

    const run = async () => {
      setLoading(true);
      setErr("");

      try {
        // 1) Resident core record
        const { data: resRow, error: resErr } = await supabase
          .from("residents")
          .select("*")
          .eq("id", residentId)
          .maybeSingle();

        if (resErr) throw resErr;
        setResident(resRow || null);

        // 2) Admission + Discharge events for this resident
        const { data: evtRows, error: evtErr } = await supabase
          .from("resident_events")
          .select(
            `
            id,
            event_type,
            created_at,
            ua_level,
            bac_level,
            event_details,
            contact_verified,
            discharge_type,
            discharge_reason,
            notes
          `
          )
          .eq("resident_id", residentId)
          .in("event_type", ["admission", "discharge"])
          .order("created_at", { ascending: true });

        if (evtErr) throw evtErr;
        setEvents(evtRows || []);
      } catch (error) {
        console.error("Error loading discharge summary:", error);
        setErr("Unable to load discharge summary.");
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [residentId]);

  if (!residentId) return null;

  if (loading) {
    return (
      <div className="mt-6 rounded-md border border-gray-200 bg-white p-4 text-sm">
        Loading discharge summary…
      </div>
    );
  }

  if (err) {
    return (
      <div className="mt-6 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        {err}
      </div>
    );
  }

  if (!resident) {
    return (
      <div className="mt-6 rounded-md border border-gray-200 bg-white p-4 text-sm">
        No resident record found.
      </div>
    );
  }

  // Pick last admission + last discharge (if any)
  const admissionEvents = events.filter((e) => e.event_type === "admission");
  const dischargeEvents = events.filter((e) => e.event_type === "discharge");

  const lastAdmission = admissionEvents[admissionEvents.length - 1] || null;
  const lastDischarge = dischargeEvents[dischargeEvents.length - 1] || null;

  const formatDate = (d) => {
    if (!d) return "—";
    try {
      return format(new Date(d), "MM/dd/yyyy");
    } catch {
      return d;
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="mt-6 rounded-md border border-gray-300 bg-white p-4 text-sm print:border-black print:bg-white">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-semibold">
          Discharge Summary – {resident.last_name}, {resident.first_name}
        </h2>
        {lastDischarge && (
          <button
            type="button"
            onClick={handlePrint}
            className="rounded bg-gray-800 px-3 py-1 text-xs font-semibold text-white hover:bg-gray-900 print:hidden"
          >
            Print Discharge Summary
          </button>
        )}
      </div>

      {/* SECTION 1 – Core Client Info */}
      <section className="mb-4">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-600">
          Client
        </h3>
        <div className="mt-1 grid grid-cols-1 gap-2 md:grid-cols-3">
          <div>
            <div className="text-[11px] text-gray-500">Name</div>
            <div className="text-sm font-medium">
              {resident.last_name}, {resident.first_name}
            </div>
          </div>
          <div>
            <div className="text-[11px] text-gray-500">DOB</div>
            <div className="text-sm">
              {resident.dob ? formatDate(resident.dob) : "—"}
            </div>
          </div>
          <div>
            <div className="text-[11px] text-gray-500">Gender</div>
            <div className="text-sm">{resident.gender || "—"}</div>
          </div>
          <div>
            <div className="text-[11px] text-gray-500">Phone</div>
            <div className="text-sm">{resident.phone || "—"}</div>
          </div>
          <div>
            <div className="text-[11px] text-gray-500">Email</div>
            <div className="text-sm">{resident.email || "—"}</div>
          </div>
          <div>
            <div className="text-[11px] text-gray-500">Level of Care</div>
            <div className="text-sm">
              {resident.clinical_status || "Unknown"}
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2 – Admission Snapshot */}
      <section className="mb-4">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-600">
          Admission Snapshot
        </h3>
        <div className="mt-1 grid grid-cols-1 gap-2 md:grid-cols-3">
          <div>
            <div className="text-[11px] text-gray-500">Admission Date</div>
            <div className="text-sm">
              {resident.admission_date
                ? formatDate(resident.admission_date)
                : lastAdmission
                ? formatDate(lastAdmission.created_at)
                : "—"}
            </div>
          </div>
          <div>
            <div className="text-[11px] text-gray-500">UA at Admission</div>
            <div className="text-sm">
              {lastAdmission?.ua_level || "Not documented"}
            </div>
          </div>
          <div>
            <div className="text-[11px] text-gray-500">BAC at Admission</div>
            <div className="text-sm">
              {lastAdmission?.bac_level || "Not documented"}
            </div>
          </div>
        </div>
        {lastAdmission?.notes && (
          <div className="mt-2">
            <div className="text-[11px] text-gray-500">Admission Notes</div>
            <div className="whitespace-pre-wrap text-sm">
              {lastAdmission.notes}
            </div>
          </div>
        )}
      </section>

      {/* SECTION 3 – Discharge Details */}
      <section className="mb-4">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-600">
          Discharge Details
        </h3>

        {!lastDischarge ? (
          <div className="mt-1 text-sm italic text-gray-500">
            No discharge event recorded for this resident.
          </div>
        ) : (
          <>
            <div className="mt-1 grid grid-cols-1 gap-2 md:grid-cols-3">
              <div>
                <div className="text-[11px] text-gray-500">
                  Discharge Date
                </div>
                <div className="text-sm">
                  {resident.discharge_date
                    ? formatDate(resident.discharge_date)
                    : formatDate(lastDischarge.created_at)}
                </div>
              </div>
              <div>
                <div className="text-[11px] text-gray-500">Discharge Type</div>
                <div className="text-sm">
                  {lastDischarge.discharge_type || "—"}
                </div>
              </div>
              <div>
                <div className="text-[11px] text-gray-500">
                  Discharge Reason
                </div>
                <div className="text-sm">
                  {lastDischarge.discharge_reason ||
                    resident.discharge_reason ||
                    "—"}
                </div>
              </div>
              <div>
                <div className="text-[11px] text-gray-500">
                  UA at Discharge
                </div>
                <div className="text-sm">
                  {lastDischarge.ua_level || "Not documented"}
                </div>
              </div>
              <div>
                <div className="text-[11px] text-gray-500">
                  BAC at Discharge
                </div>
                <div className="text-sm">
                  {lastDischarge.bac_level || "Not documented"}
                </div>
              </div>
              <div>
                <div className="text-[11px] text-gray-500">
                  EC Contact Verified
                </div>
                <div className="text-sm">
                  {lastDischarge.contact_verified ? "Yes" : "No / Not logged"}
                </div>
              </div>
            </div>

            {lastDischarge.event_details && (
              <div className="mt-2">
                <div className="text-[11px] text-gray-500">
                  EC Notification Notes
                </div>
                <div className="whitespace-pre-wrap text-sm">
                  {lastDischarge.event_details}
                </div>
              </div>
            )}

            {lastDischarge.notes && (
              <div className="mt-2">
                <div className="text-[11px] text-gray-500">
                  Discharge Narrative
                </div>
                <div className="whitespace-pre-wrap text-sm">
                  {lastDischarge.notes}
                </div>
              </div>
            )}
          </>
        )}
      </section>

      {/* SECTION 4 – Footer */}
      <section className="border-t border-dashed pt-2 mt-2 text-[11px] text-gray-500 print:text-[10px]">
        Oceanside Housing – Internal Use Only.  
        Generated via Oceanside Housing Support System.
      </section>
    </div>
  );
}
