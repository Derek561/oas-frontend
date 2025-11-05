"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";

export default function CensusPage() {
  const [census, setCensus] = useState([]);
  const [houses, setHouses] = useState([]);
  const [snapshots, setSnapshots] = useState([]);
  const [selectedHouse, setSelectedHouse] = useState("");
  const [totalCapacity, setTotalCapacity] = useState("");
  const [activeCount, setActiveCount] = useState("");

  // Load data on mount
  useEffect(() => {
    fetchHouses();
    fetchCensus();
    fetchSnapshots();
  }, []);

  // ✅ Fetch houses
  async function fetchHouses() {
    const { data, error } = await supabase
      .from("houses")
      .select("id, name, capacity")
      .order("name", { ascending: true });

    if (error) console.error("Error fetching houses:", error.message);
    else setHouses(data || []);
  }

  // ✅ Fetch live census data
  async function fetchCensus() {
    const { data, error } = await supabase
      .from("census")
      .select("id, census_date, house_id, active_count, houses(name, capacity)")
      .order("census_date", { ascending: false });

    if (error) console.error("Error fetching census:", error.message);
    else setCensus(data || []);
  }

  // ✅ Fetch historical census snapshots
  async function fetchSnapshots() {
    const { data, error } = await supabase
      .from("census_snapshots")
      .select("id, census_date, house_id, active_count, created_at, houses(name)")
      .order("created_at", { ascending: false });

    if (error) console.error("Error fetching snapshots:", error.message);
    else setSnapshots(data || []);
  }

  // ✅ Add new census record
  async function handleAddCensus(e) {
    e.preventDefault();
    try {
      const { error } = await supabase.from("census").insert({
        house_id: selectedHouse,
        active_count: parseInt(activeCount) || 0,
        census_date: new Date().toISOString().split("T")[0],
      });

      if (error) throw error;
      alert("✅ Census record added successfully.");

      setSelectedHouse("");
      setActiveCount("");
      fetchCensus();
      fetchSnapshots();
    } catch (err) {
      console.error("Error adding census:", err);
      alert("⚠️ Error adding census record.");
    }
  }

  // ✅ Delete census record safely
  async function handleDeleteCensus(id) {
    if (!confirm("Are you sure you want to delete this record?")) return;

    try {
      const { error } = await supabase.from("census").delete().eq("id", id);
      if (error) throw error;

      alert("✅ Record deleted successfully.");
      fetchCensus();
      fetchSnapshots();
    } catch (err) {
      console.error("Error deleting record:", err.message);
      alert("⚠️ Error deleting record. Check console for details.");
    }
  }

  // ✅ Calculate Occupancy %
  function calculateOccupancy(c) {
    const capacity = c.houses?.capacity || totalCapacity || 0;
    if (!capacity) return 0;
    return ((c.active_count / capacity) * 100).toFixed(1);
  }

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-2xl font-semibold">Census Dashboard</h2>

      {/* --- Add Census Record Form --- */}
      <Card className="p-4">
        <form onSubmit={handleAddCensus} className="grid md:grid-cols-3 gap-4">
          <select
            value={selectedHouse}
            onChange={(e) => setSelectedHouse(e.target.value)}
            className="border p-2 rounded"
            required
          >
            <option value="">Select House</option>
            {houses.map((h) => (
              <option key={h.id} value={h.id}>
                {h.name}
              </option>
            ))}
          </select>

          <input
            type="number"
            placeholder="Active Residents"
            value={activeCount}
            onChange={(e) => setActiveCount(e.target.value)}
            className="border p-2 rounded"
            required
          />

          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Add Record
          </button>
        </form>
      </Card>

      {/* --- Live Census Table --- */}
      <Card className="shadow-lg border rounded-2xl bg-white mt-6">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-gray-700">
            Current Census
          </CardTitle>
        </CardHeader>

        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>House</TableHead>
                <TableHead>Active Count</TableHead>
                <TableHead>Capacity</TableHead>
                <TableHead>Occupancy %</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {census.map((row) => (
                <TableRow
                  key={`${row.id || row.house_id}-${row.census_date || Math.random()}`}
                >
                  <TableCell>{row.houses?.name || "—"}</TableCell>
                  <TableCell>{row.active_count ?? "—"}</TableCell>
                  <TableCell>{row.houses?.capacity ?? "—"}</TableCell>
                  <TableCell>
                    {row.houses?.capacity
                      ? `${calculateOccupancy(row)}%`
                      : "N/A"}
                  </TableCell>
                  <TableCell>
                    {row.census_date
                      ? new Date(row.census_date).toLocaleDateString()
                      : "—"}
                  </TableCell>
                  <TableCell>
                    <button
                      onClick={() => handleDeleteCensus(row.id)}
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

      {/* --- Historical Snapshots --- */}
      <Card className="shadow-lg border rounded-2xl bg-white mt-8">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-gray-700">
            Census History
          </CardTitle>
        </CardHeader>

        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Snapshot Date</TableHead>
                <TableHead>House</TableHead>
                <TableHead>Active Count</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {snapshots.map((s) => (
                <TableRow
                  key={`${s.id || s.house_id}-${s.census_date || Math.random()}`}
                >
                  <TableCell>
                    {s.census_date
                      ? new Date(s.census_date).toLocaleDateString()
                      : "—"}
                  </TableCell>
                  <TableCell>{s.houses?.name || "—"}</TableCell>
                  <TableCell>{s.active_count ?? "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
