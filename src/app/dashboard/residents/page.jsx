"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
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

export default function ResidentsPage() {
  const [houses, setHouses] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [residents, setResidents] = useState([]);

  // Form State
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [status, setStatus] = useState("Active");
  const [clinicalStatus, setClinicalStatus] = useState("Active");
  const [admissionDate, setAdmissionDate] = useState("");
  const [selectedHouse, setSelectedHouse] = useState("");
  const [selectedRoom, setSelectedRoom] = useState("");

  // Room Filter
  const availableRooms = useMemo(
    () => rooms.filter((r) => r.house_id === selectedHouse),
    [rooms, selectedHouse]
  );

  // Initial Load
  useEffect(() => {
    fetchHouses();
    fetchRooms();
    fetchResidents();
  }, []);

  // Fetch Houses
  async function fetchHouses() {
    const { data, error } = await supabase
      .from("houses")
      .select("id, name")
      .order("name", { ascending: true });
    if (error) console.error("Error fetching houses:", error);
    else setHouses(data || []);
  }

  // Fetch Rooms
  async function fetchRooms() {
    const { data, error } = await supabase
      .from("rooms")
      .select("id, room_number, capacity, house_id")
      .order("room_number", { ascending: true });
    if (error) console.error("Error fetching rooms:", error);
    else setRooms(data || []);
  }

  // Fetch Residents
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
        houses!residents_house_fk (
          id, name
        ),
        rooms!residents_room_fk (
          id, room_number
        )
      `)
      .order("admission_date", { ascending: false });

    if (error) console.error("Error fetching residents:", error);
    else setResidents(data || []);
  }

  // Add Resident
  async function handleAddResident(e) {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim()) {
      alert("Please enter both first and last name.");
      return;
    }
    if (!selectedHouse) {
      alert("Please select a house.");
      return;
    }

    const { error } = await supabase.from("residents").insert([
      {
        first_name: firstName,
        last_name: lastName,
        status: "Active",
        clinical_status: "Unknown",
        admission_date: new Date().toISOString().split("T")[0],
        discharge_date: null,
        house_id: selectedHouse,
        room_id: selectedRoom || null,
      },
    ]);

    if (error) {
      console.error("Error adding resident:", error);
      alert("⚠️ Error adding resident.");
      return;
    }

    alert("✅ Resident added successfully.");
    setFirstName("");
    setLastName("");
    setSelectedHouse("");
    setSelectedRoom("");
    fetchResidents();
  }

  // Delete Resident
  async function handleDeleteResident(id) {
    if (!confirm("Are you sure you want to delete this resident?")) return;
    const { error } = await supabase.from("residents").delete().eq("id", id);
    if (error) {
      console.error("Error deleting resident:", error);
      alert("⚠️ Error deleting resident.");
      return;
    }
    alert("✅ Resident deleted successfully.");
    fetchResidents();
  }

  // Discharge Resident
  async function handleDischargeResident(id) {
    if (!id) return alert("Missing resident ID");
    const today = new Date().toISOString().split("T")[0];
    const { error } = await supabase
      .from("residents")
      .update({
        status: "Discharged",
        discharge_date: today,
      })
      .eq("id", id);
    if (error) {
      console.error("Error discharging resident:", error);
      alert("⚠️ Error discharging resident.");
    } else {
      alert("✅ Resident discharged successfully.");
      fetchResidents();
    }
  }

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-2xl font-semibold">Residents</h2>

      {/* Add Resident Form */}
      <Card className="p-4">
        <form
          onSubmit={handleAddResident}
          className="grid md:grid-cols-6 gap-4"
        >
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

      {/* Residents Table */}
      <Card className="shadow-lg border rounded-2xl bg-white mt-6">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-gray-700">
            Current Residents
          </CardTitle>
        </CardHeader>
        <CardContent>
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
                  <TableCell>
                    {r.first_name} {r.last_name}
                  </TableCell>
                  <TableCell>{r.houses?.name || "—"}</TableCell>
                  <TableCell>{r.rooms?.room_number || "—"}</TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        r.status === "Active"
                          ? "bg-green-100 text-green-700"
                          : r.status === "Discharged"
                          ? "bg-red-100 text-red-700"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {r.status || "Unknown"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        r.clinical_status === "Active"
                          ? "bg-green-100 text-green-700"
                          : r.clinical_status === "Clinical Hold"
                          ? "bg-yellow-100 text-yellow-800"
                          : r.clinical_status === "Non-Clinical"
                          ? "bg-blue-100 text-blue-800"
                          : r.clinical_status === "Discharged"
                          ? "bg-gray-200 text-gray-700"
                          : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {r.clinical_status || "—"}
                    </span>
                  </TableCell>
                  <TableCell>{r.admission_date || "—"}</TableCell>
                  <TableCell className="text-center space-x-3">
                    <button
                      onClick={() => handleDischargeResident(r.id)}
                      className="text-blue-600 hover:underline"
                    >
                      Discharge
                    </button>
                    <button
                      onClick={() => handleDeleteResident(r.id)}
                      className="text-red-600 hover:underline"
                    >
                      Delete
                    </button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
