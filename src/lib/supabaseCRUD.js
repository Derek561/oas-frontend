import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

/**
 * Generic CRUD helper for any table.
 * Usage:
 *   import { CRUD } from "@/lib/supabaseCRUD"
 *   await CRUD.insert("staff", { name: "John" })
 */
export const CRUD = {
  // Read all rows
  async read(table, orderBy = "created_at", ascending = false) {
    const { data, error } = await supabase
      .from(table)
      .select("*")
      .order(orderBy, { ascending });
    if (error) console.error(`${table} READ error:`, error);
    return data || [];
  },

  // Insert a new row
  async insert(table, values) {
    const { data, error } = await supabase.from(table).insert([values]).select();
    if (error) console.error(`${table} INSERT error:`, error);
    return { data, error };
  },

  // Update existing row
  async update(table, id, values) {
    const { data, error } = await supabase
      .from(table)
      .update(values)
      .eq("id", id)
      .select();
    if (error) console.error(`${table} UPDATE error:`, error);
    return { data, error };
  },

  // Delete row
  async remove(table, id) {
    const { error } = await supabase.from(table).delete().eq("id", id);
    if (error) console.error(`${table} DELETE error:`, error);
    return { error };
  },
};
