import { createClient } from "https://esm.sh/@supabase/supabase-js@2.46.1";
import * as bcrypt from "https://deno.land/x/bcrypt@v0.4.1/mod.ts";

Deno.serve(async (req) => {
  try {
    const { pin, resident_id, note } = await req.json();
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: staffRows } = await supabase.from("staff").select("id,pin_hash,assigned_house_id");
    const staff = staffRows?.find((s) => bcrypt.compareSync(pin, s.pin_hash));
    if (!staff) throw new Error("Invalid PIN");

    const updates = {
      is_active: false,
      discharged_at: new Date().toISOString(),
    };

    const { error: upErr } = await supabase
      .from("residents")
      .update(updates)
      .eq("id", resident_id);

    if (upErr) throw upErr;

    await supabase.from("resident_status_history").insert([
      {
        resident_id,
        house_id: staff.assigned_house_id,
        status: "discharged",
        note,
      },
    ]);

    return new Response(
      JSON.stringify({ ok: true, message: "Resident discharged" }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ ok: false, error: err.message }),
      { headers: { "Content-Type": "application/json" }, status: 400 }
    );
  }
});
