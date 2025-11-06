"use client";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import ResidentIntakeModal from "@/components/modals/ResidentEventModal";
import ResidentDischargeModal from "@/components/modals/ResidentDischargeModal";
import {
  Card,
  CardHeader,
  CardContent,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";

/**
 * ResidentsPage – full working MVP version
 * Includes:
 * ✅ Intake + Discharge + Re-Admit
 * ✅ Auto-refresh
 * ✅ Split Active vs Discharged
 * ✅ History drawer
 */

export default function ResidentsPage() {
  // master data
  const [houses, setHouses] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [residents, setResidents] = useState([]);
  const [refreshKey, setRefreshKey] = useState(0);

  // history drawer
  const [historyOpenFor, setHistoryOpenFor] = useState(null);
  const [residentHistory, setResidentHistory] = useState([]);

  // add form
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [selectedHouse, setSelectedHouse] = useState("");
  const [selectedRoom, setSelectedRoom] = useState("");
  const [admissionDate, setAdmissionDate] = useState("");

  // modal control
  const [modalType, setModalType] = useState(null); // "intake" | "discharge" | null
  const [selectedResident, setSelectedResident] = useState(null);

  // derived: rooms limited to chosen house
  const availableRooms = useMemo(
    () => rooms.filter((r) => r.house_id === selectedHouse),
    [rooms, selectedHouse]
  );

  // initial load + refresh trigger
  useEffect(() => {
    refreshAll();
  }, [refreshKey]);

  async function refreshAll() {
    await Promise.all([fetchHouses(), fetchRooms(), fetchResidents()]);
  }

  async function fetchHouses() {
    const { data, error } = await supabase
      .from("houses")
      .select("id, name")
      .order("name", { ascending: true });
    if (error) console.error("Houses fetch error:", error.message);
    else setHouses(data || []);
  }

  async function fetchRooms() {
    const { data, error } = await supabase
      .from("available_rooms")
      .select("id, room_number, capacity, house_id, active_count")
      .order("room_number", { ascending: true });
    if (error) console.error("Rooms fetch error:", error.message);
    else setRooms(data || []);
  }

  async function fetchResidents() {
    const { data, error } = await supabase
      .from("residents")
      .select(`
        id,
        first_name,
        last_name,
        status,
        clinical_status,
        admission_date,
        discharge_date,
        house_id,
        room_id,
        houses!residents_house_fk ( id, name ),
        rooms!residents_room_fk ( id, room_number )
      `)
      .order("admission_date", { ascending: false });

    if (error) console.error("Residents fetch error:", error.message);
    else setResidents(data || []);
  }

  async function fetchResidentHistory(residentId) {
    setHistoryOpenFor(residentId);
    const { data, error } = await supabase
      .from("resident_events")
      .select(
        "id, event_type, notes, ua_level, bac_level, discharge_reason, contact_verified, created_at"
      )
      .eq("resident_id", residentId)
      .order("created_at", { ascending: false });
    if (error) console.error("Resident history error:", error.message);
    else setResidentHistory(data || []);
  }

  // ADD RESIDENT -> open Intake modal
  async function handleAddResident(e) {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim() || !selectedHouse) {
      alert("Please enter first name, last name, and house.");
      return;
    }

    const { data, error } = await supabase
      .from("residents")
      .insert([
        {
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          status: "Active",
          clinical_status: "Active",
          admission_date:
            admissionDate || new Date().toISOString().split("T")[0],
          discharge_date: null,
          house_id: selectedHouse,
          room_id: selectedRoom || null,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("Add resident error:", error.message);
      alert("⚠️ Error adding resident.");
      return;
    }

    // clear form, refresh, then open intake modal
    setFirstName("");
    setLastName("");
    setSelectedHouse("");
    setSelectedRoom("");
    setAdmissionDate("");
    setSelectedResident(data);
    setModalType("intake");
    setRefreshKey((k) => k + 1);
  }

  // DELETE
  async function handleDeleteResident(id) {
    if (!confirm("Are you sure you want to delete this resident?")) return;
    const { error } = await supabase.from("residents").delete().eq("id", id);
    if (error) {
      console.error("Delete error:", error.message);
      alert("⚠️ Error deleting resident.");
      return;
    }
    alert("✅ Resident deleted successfully.");
    setRefreshKey((k) => k + 1);
  }

  // DISCHARGE (open modal)
  function handleOpenDischarge(resident) {
    setSelectedResident(resident);
    setModalType("discharge");
  }

  // CLINICAL STATUS UPDATE
  async function handleUpdateClinicalStatus(residentId, newStatus) {
    const { error } = await supabase
      .from("residents")
      .update({ clinical_status: newStatus })
      .eq("id", residentId);
    if (error) {
      console.error("Clinical status update error:", error.message);
      alert("⚠️ Error updating clinical status.");
      return;
    }
    setRefreshKey((k) => k + 1);
  }

  // RE-ADMIT (for discharged)
  async function handleReAdmit(residentId) {
    const { error } = await supabase
      .from("residents")
      .update({
        status: "Active",
        clinical_status: "Active",
        discharge_date: null,
      })
      .eq("id", residentId);

    if (error) {
      console.error("Re-Admit error:", error.message);
      alert("⚠️ Error during re-admission.");
      return;
    }

    alert("✅ Resident successfully re-admitted.");
    setRefreshKey((k) => k + 1);
  }

  // close modal → refresh
  function handleCloseModal(shouldRefresh = false) {
    setModalType(null);
    setSelectedResident(null);
    if (shouldRefresh) setRefreshKey((k) => k + 1);
  }

  // Split residents
  const activeResidents = residents.filter((r) => r.status === "Active");
  const dischargedResidents = residents.filter(
    (r) => r.status === "Discharged"
  );

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-2xl font-semibold">Residents</h2>

      {/* Add Resident */}
      <Card className="p-4">
        <form onSubmit={handleAddResident} className="grid md:grid-cols-6 gap-4">
          <input
            type="text"
            placeholder="First name"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className="border p-2 rounded"
            required
          />
          <input
            type="text"
            placeholder="Last name"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            className="border p-2 rounded"
            required
          />
          <select
            value={selectedHouse}
            onChange={(e) => {
              setSelectedHouse(e.target.value);
              setSelectedRoom("");
            }}
            className="border p-2 rounded"
            required
          >
            <option value="">Select house</option>
            {houses.map((h) => (
              <option key={h.id} value={h.id}>
                {h.name}
              </option>
            ))}
          </select>
          <select
            value={selectedRoom}
            onChange={(e) => setSelectedRoom(e.target.value)}
            className="border p-2 rounded"
            disabled={!selectedHouse}
          >
            <option value="">(Optional) Room</option>
            {availableRooms.map((r) => (
              <option key={r.id} value={r.id}>
                {r.room_number}
              </option>
            ))}
          </select>
          <input
            type="date"
            value={admissionDate}
            onChange={(e) => setAdmissionDate(e.target.value)}
            className="border p-2 rounded"
          />
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Add Resident
          </button>
        </form>
      </Card>

      {/* Active Residents */}
      <Card className="shadow-lg border rounded-2xl bg-white mt-6">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-gray-700">
            Current Residents
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResidentTable
            residents={activeResidents}
            onDischarge={handleOpenDischarge}
            onDelete={handleDeleteResident}
            onClinicalChange={handleUpdateClinicalStatus}
            onReAdmit={handleReAdmit}
            onHistory={fetchResidentHistory}
            historyOpenFor={historyOpenFor}
            residentHistory={residentHistory}
            setHistoryOpenFor={setHistoryOpenFor}
          />
        </CardContent>
      </Card>

      {/* Discharged Residents */}
      {dischargedResidents.length > 0 && (
        <Card className="shadow-lg border rounded-2xl bg-white mt-6">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-gray-700">
              Discharged Residents (Archive)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResidentTable
              residents={dischargedResidents}
              onDischarge={handleOpenDischarge}
              onDelete={handleDeleteResident}
              onClinicalChange={handleUpdateClinicalStatus}
              onReAdmit={handleReAdmit}
              onHistory={fetchResidentHistory}
              historyOpenFor={historyOpenFor}
              residentHistory={residentHistory}
              setHistoryOpenFor={setHistoryOpenFor}
            />
          </CardContent>
        </Card>
      )}

      {/* Modals */}
      {modalType === "intake" && selectedResident && (
        <ResidentIntakeModal
          resident={selectedResident}
          onClose={() => handleCloseModal(true)}
        />
      )}
      {modalType === "discharge" && selectedResident && (
        <ResidentDischargeModal
          resident={selectedResident}
          onClose={() => handleCloseModal(true)}
        />
      )}
    </div>
  );
}

/* Helper Component for tables */
function ResidentTable({
  residents,
  onDischarge,
  onDelete,
  onClinicalChange,
  onReAdmit,
  onHistory,
  historyOpenFor,
  residentHistory,
  setHistoryOpenFor,
}) {
  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>House</TableHead>
            <TableHead>Room</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Clinical</TableHead>
            <TableHead>Admission</TableHead>
            <TableHead className="text-center">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {residents.map((r) => (
            <TableRow key={r.id}>
              <TableCell>{r.first_name} {r.last_name}</TableCell>
              <TableCell>{r.houses?.name || "—"}</TableCell>
              <TableCell>{r.rooms?.room_number || "—"}</TableCell>
              <TableCell>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-semibold ${
                    r.status === "Active"
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {r.status}
                </span>
              </TableCell>
              <TableCell>
                <select
                  value={r.clinical_status || "Unknown"}
                  onChange={(e) => onClinicalChange(r.id, e.target.value)}
                  className="border rounded p-1 text-sm"
                >
                  <option value="Active">Active</option>
                  <option value="Clinical Hold">Clinical Hold</option>
                  <option value="Non-Clinical">Non-Clinical</option>
                  <option value="Discharged">Discharged</option>
                  <option value="Unknown">Unknown</option>
                </select>
              </TableCell>
              <TableCell>{r.admission_date || "—"}</TableCell>
              <TableCell className="text-center space-x-3">
                {r.status === "Discharged" ? (
                  <button
                    onClick={() => onReAdmit(r.id)}
                    className="text-green-600 hover:underline"
                  >
                    Re-Admit
                  </button>
                ) : (
                  <button
                    onClick={() => onDischarge(r)}
                    className="text-blue-600 hover:underline"
                  >
                    Discharge
                  </button>
                )}
                <button
                  onClick={() => onDelete(r.id)}
                  className="text-red-600 hover:underline"
                >
                  Delete
                </button>
                <button
                  onClick={() =>
                    historyOpenFor === r.id
                      ? setHistoryOpenFor(null)
                      : onHistory(r.id)
                  }
                  className="text-gray-600 hover:underline"
                >
                  {historyOpenFor === r.id ? "Hide History" : "History"}
                </button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Resident History Drawer */}
      {historyOpenFor && (
        <div className="mt-6 rounded-lg border bg-gray-50 p-4">
          <h3 className="font-semibold mb-2">Resident Event History</h3>
          {residentHistory.length === 0 ? (
            <div className="text-sm text-gray-500">No events recorded.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Event</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead>UA</TableHead>
                  <TableHead>BAC</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {residentHistory.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          e.event_type === "admission"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {e.event_type}
                      </span>
                    </TableCell>
                    <TableCell>{e.notes || "—"}</TableCell>
                    <TableCell>{e.ua_level || "—"}</TableCell>
                    <TableCell>{e.bac_level || "—"}</TableCell>
                    <TableCell>{e.discharge_reason || "—"}</TableCell>
                    <TableCell>
                      {e.created_at
                        ? new Date(e.created_at).toLocaleString()
                        : "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      )}
    </>
  );
}
