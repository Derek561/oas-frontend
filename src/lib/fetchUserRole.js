"use client";
import { createClient } from "@/lib/supabaseClient";

export async function fetchUserRole(authUserId) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("users")
    .select("role")
    .eq("auth_user_id", authUserId)
    .order("created_at", { ascending: false })
    .limit(1); // get the latest

  if (error) {
    console.error("Error fetching role:", error.message);
    return null;
  }

  if (!data || data.length === 0) {
    console.warn("No role found for user:", authUserId);
    return null;
  }

  return data[0].role;
}
