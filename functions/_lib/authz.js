import { supabaseJson } from "./supabase.js";

export async function getCallerRole(env, uid) {
  const rows = await supabaseJson(env, {
    table: "app_users",
    query: `?uid=eq.${encodeURIComponent(uid)}&select=role,employee_id`,
  });
  return rows[0] || null;
}
