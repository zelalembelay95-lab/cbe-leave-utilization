import { verifyFirebaseToken, json, errorResponse, AuthError } from "../_lib/firebaseAuth.js";
import { supabaseJson } from "../_lib/supabase.js";
import { getCallerRole } from "../_lib/authz.js";

// POST /api/dedupe-leave-entries
// Admin only. Scans every leave entry, groups by (employee, start date, end
// date, day count), keeps the oldest submission in each group, and deletes
// the rest. Use this once to clean up anything duplicated before the
// duplicate guard on POST /api/leave-entries was added.
export async function onRequestPost(context) {
  const { request, env } = context;
  try {
    const caller = await verifyFirebaseToken(request, env);
    const me = await getCallerRole(env, caller.uid);
    if (!me || me.role !== "admin") throw new AuthError("Admins only", 403);

    const rows = await supabaseJson(env, {
      table: "leave_entries",
      query: "?select=id,employee_id,start_date,end_date,days_count,submitted_at&order=submitted_at.asc",
    });

    const seen = new Map();
    const toDelete = [];
    for (const row of rows) {
      const key = `${row.employee_id}|${row.start_date}|${row.end_date}|${row.days_count}`;
      if (seen.has(key)) {
        toDelete.push(row.id);
      } else {
        seen.set(key, row.id);
      }
    }

    if (toDelete.length) {
      const idList = toDelete.map((id) => `"${id}"`).join(",");
      await supabaseJson(env, {
        table: "leave_entries",
        method: "DELETE",
        query: `?id=in.(${idList})`,
      });
    }

    return json({ removed: toDelete.length, scanned: rows.length });
  } catch (err) {
    return errorResponse(err);
  }
}
