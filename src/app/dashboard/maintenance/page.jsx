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
  TableHead,
  TableRow,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/**
 * Maintenance Dashboard (Stable, Supabase-aligned)
 * - Inserts issues using valid FK (submitted_by → staff.id)
 * - Joins staff.name for Submitted By column
 * - Admin role lock for delete
 * - MVP mode: house_id + assigned_to remain null
 */

export default function MaintenancePage() {
  const [issues, setIssues] = useState([]);
  const [userName, setUserName] = useState("—");
  const [userRole, setUserRole] = useState("Admin"); // fallback for now
  const [staffId, setStaffId] = useState(null);

  // form state
  const [issueText, setIssueText] = useState("");
  const [priority, setPriority] = useState("Medium");
  const [location, setLocation] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  // Load current user + staff match
  useEffect(() => {
    (async () => {
      const { data: auth } = await supabase.auth.getUser();
      const email = auth?.user?.email || null;

      if (!email) return;

      // find the staff entry for this email
      const { data: staffRow, error } = await supabase
        .from("staff")
        .select("id, name, role, active")
        .eq("email", email)
        .eq("active", true)
        .maybeSingle();

      if (error) console.error("Staff lookup error:", error.message);
      if (staffRow) {
        setUserName(staffRow.name || email);
        setUserRole(staffRow.role || "Staff");
        setStaffId(staffRow.id);
      } else {
        // no staff record found — still allow logging issue
        setUserName(email);
        setStaffId(null);
      }
    })();
  }, []);

  // Fetch issues on load
  useEffect(() => {
    fetchIssues();
  }, []);

  async function fetchIssues() {
    const { data, error } = await supabase
      .from("maintenance")
      .select(`
        id,
        issue,
        priority,
        status,
        created_at,
        resolved_at,
        staff:submitted_by ( name )
      `)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Maintenance fetch error:", error.message);
      setIssues([]);
      return;
    }
    setIssues(data || []);
  }

  async function handleAddIssue() {
    if (!issueText.trim()) {
      alert("Please describe the issue first.");
      return;
    }

    const payload = {
      issue: issueText.trim(),
      priority,
      status: "Open",
      submitted_by: staffId, // ✅ valid FK (null if not matched)
      house_id: null,
      assigned_to: null,
    };

    if (location.trim()) {
      payload.issue = `${payload.issue} (Location: ${location.trim()})`;
    }

    const { error } = await supabase.from("maintenance").insert([payload]);
    if (error) {
      console.error("Add issue error:", error.message);
      alert("⚠️ Error adding maintenance issue.");
      return;
    }

    setIssueText("");
    setLocation("");
    await fetchIssues();
  }

  async function updateStatus(rowId, newStatus) {
    const patch = { status: newStatus };
    if (newStatus === "Resolved") patch.resolved_at = new Date().toISOString();

    const { error } = await supabase
      .from("maintenance")
      .update(patch)
      .eq("id", rowId);

    if (error) {
      console.error("Status update error:", error.message);
      return;
    }
    fetchIssues();
  }

  async function deleteIssue(rowId) {
    if (userRole !== "Admin") {
      alert("Only Admin can delete maintenance issues.");
      return;
    }
    if (!confirm("Delete this maintenance issue?")) return;

    const { error } = await supabase
      .from("maintenance")
      .delete()
      .eq("id", rowId);

    if (error) {
      console.error("Delete error:", error.message);
      return;
    }
    fetchIssues();
  }

  const filteredIssues = useMemo(() => {
    if (statusFilter === "All") return issues;
    return (issues || []).filter((i) => i.status === statusFilter);
  }, [issues, statusFilter]);

  const statusBadge = (value) => {
    const base = "px-2 py-1 rounded text-xs font-medium";
    if (value === "Open") return `${base} bg-yellow-100 text-yellow-800`;
    if (value === "In Progress") return `${base} bg-blue-100 text-blue-800`;
    if (value === "Resolved") return `${base} bg-green-100 text-green-800`;
    return `${base} bg-gray-100 text-gray-700`;
  };

  const priorityBadge = (p) => {
    const base = "px-2 py-1 rounded text-xs font-medium";
    if (p === "High") return `${base} bg-red-100 text-red-800`;
    if (p === "Medium") return `${base} bg-yellow-100 text-yellow-800`;
    return `${base} bg-green-100 text-green-800`; // Low
  };

  return (
    <Card className="m-6">
      <CardHeader>
        <CardTitle>Maintenance Dashboard</CardTitle>
        <p className="text-sm text-gray-500">
          Currently Viewing: All Houses ({userRole})
        </p>
      </CardHeader>

      <CardContent>
        {/* Add Issue */}
        <div className="flex flex-wrap gap-2 mb-6">
          <Input
            placeholder="Describe issue (e.g., AC not working)"
            value={issueText}
            onChange={(e) => setIssueText(e.target.value)}
            className="min-w-[260px]"
          />

          <select
            className="border rounded-md px-3 py-2"
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
          >
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
          </select>

          <Input
            placeholder="Location / Unit (e.g., Blue Bldg Apt 5)"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="min-w-[220px]"
          />

          <Button onClick={handleAddIssue}>Add Issue</Button>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 mb-4">
          <span className="text-sm text-gray-600">Status:</span>
          <select
            className="border rounded-md px-3 py-2"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option>All</option>
            <option>Open</option>
            <option>In Progress</option>
            <option>Resolved</option>
          </select>
        </div>

        {/* Table */}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Issue</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Submitted By</TableHead>
              <TableHead>House</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Resolved</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {filteredIssues.map((row) => (
              <TableRow key={row.id}>
                <TableCell className="whitespace-pre-wrap">{row.issue}</TableCell>
                <TableCell>
                  <span className={priorityBadge(row.priority)}>{row.priority}</span>
                </TableCell>
                <TableCell>
                  <span className={statusBadge(row.status)}>{row.status}</span>
                </TableCell>
                <TableCell>{row.staff?.name ?? "—"}</TableCell>
                <TableCell>{row.house_id ? "—" : "—"}</TableCell>
                <TableCell>
                  {row.created_at ? new Date(row.created_at).toLocaleDateString() : "—"}
                </TableCell>
                <TableCell>
                  {row.resolved_at ? new Date(row.resolved_at).toLocaleDateString() : "—"}
                </TableCell>
                <TableCell className="flex gap-2">
                  {row.status === "Open" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateStatus(row.id, "In Progress")}
                    >
                      Start
                    </Button>
                  )}
                  {row.status === "In Progress" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateStatus(row.id, "Resolved")}
                    >
                      Resolve
                    </Button>
                  )}
                  {userRole === "Admin" && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => deleteIssue(row.id)}
                    >
                      Delete
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
