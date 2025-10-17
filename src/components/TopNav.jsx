"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { fetchUserRole } from "@/lib/fetchUserRole";

export default function TopNav() {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState("loading...");
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    async function loadUser() {
      const { data, error } = await supabase.auth.getUser();
      if (!error && data.user) {
        setUser(data.user);
        const role = await fetchUserRole(data.user.id);
        setRole(role || "user");
      }
    }
    loadUser();
  }, [supabase]);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <header className="bg-white shadow-md flex justify-between items-center px-6 py-3">
      <h1 className="font-semibold text-lg">Oceanside Housing Dashboard</h1>

      <div className="flex items-center gap-4 text-sm text-gray-600">
        {user ? (
          <>
            <div>
              <p className="font-medium">{user.email}</p>
              <p className="text-xs text-gray-500">
                Role:{" "}
                <span
                  className={`font-semibold ${
                    role === "admin"
                      ? "text-red-600"
                      : role === "manager"
                      ? "text-blue-600"
                      : "text-gray-600"
                  }`}
                >
                  {role}
                </span>
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm"
            >
              Logout
            </button>
          </>
        ) : (
          <p>Loading...</p>
        )}
      </div>
    </header>
  );
}
