import { Resend } from "resend";
import { createClient } from "@supabase/supabase-js";

export async function GET() {
  try {
    const response = await fetch(
      `${process.env.URL}/.netlify/functions/dailySummary`,
      { headers: { Authorization: `Bearer ${process.env.INTERNAL_KEY}` } }
    );
    const data = await response.json();
    return Response.json(data);
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
