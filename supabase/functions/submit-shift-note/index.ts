import { createClient } from "https://esm.sh/@supabase/supabase-js@2.46.1";
import * as bcrypt from "https://deno.land/x/bcrypt@v0.4.1/mod.ts";

Deno.serve(async (req) => {
  console.log("EDGE FUNCTION TRIGGERED:", new Date().toISOString());

  try {
    const { pin, shift_name, body, severity } = await req.json();

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );


    // 🔍 Step 1: Locate staff record
    const { data: staffRow, error: staffError } = await supabase
      .from("staff")
      .select("id, assigned_house_id, pin_hash")
      .not("pin_hash", "is", null);

    if (staffError || !staffRow?.length)
      throw new Error("No staff records found.");

    // 🔑 Step 2: Compare input PIN
    const matched = staffRow.find((r) => bcrypt.compareSync(pin, r.pin_hash));
    if (!matched) {
      return new Response(
        JSON.stringify({ ok: false, message: "Invalid PIN" }),
        { headers: { "Content-Type": "application/json" }, status: 401 }
      );
    }

    // 🧭 Step 3: Insert shift note
    const { data, error } = await supabase
      .from("shift_notes")
      .insert([
        {
          house_id: matched.assigned_house_id,
          author_user: matched.id,
          shift_name,
          date_for: new Date().toISOString().slice(0, 10),
          severity,
          body,
          tags: [],
        },
      ])
      .select();

    if (error) throw error;

    return new Response(
      JSON.stringify({ ok: true, message: "Shift note saved", note: data[0] }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Function error:", err);
    return new Response(
      JSON.stringify({ ok: false, message: "Failed", details: err.message }),
      { headers: { "Content-Type": "application/json" }, status: 400 }
    );
  }
});
