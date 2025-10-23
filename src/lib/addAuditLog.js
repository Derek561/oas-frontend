import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

/**
 * Adds an entry into audit_logs for tracking user actions.
 * @param {string} action - e.g. "Resident Updated"
 * @param {string} tableName - the affected table (e.g. "residents")
 * @param {string} recordId - the record’s UUID
 * @param {object} [details] - optional extra context about the change
 */
export async function addAuditLog(action, tableName, recordId, details = {}) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user ? user.id : null;

    const { error } = await supabase.from("audit_logs").insert([
      {
        user_id: userId,
        action,
        table_name: tableName,
        record_id: recordId,
        details,
      },
    ]);

    if (error) console.error("Audit log insert error:", error);
  } catch (err) {
    console.error("Audit log helper failure:", err);
  }
}
