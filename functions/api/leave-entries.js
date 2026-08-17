import { verifyFirebaseToken, json, errorResponse, AuthError } from "../_lib/firebaseAuth.js";
import { supabaseJson } from "../_lib/supabase.js";
import { getCallerRole } from "../_lib/authz.js";

// GET    /api/leave-entries?year=2026&teamLeaderUid=...  -> list (any approved user; optionally filtered)
// POST   /api/leave-entries                              -> create one entry (admin / team_leader only)
// DELETE /api/leave-entries?id=...                        -> remove (admin, or the team leader who submitted it)
export async function onRequestGet(context) {
  const { request, env } = context;
  try {
    const caller = await verifyFirebaseToken(request, env);
    const me = await getCallerRole(env, caller.uid);
    if (!me || me.role === "pending") throw new AuthError("Account not yet approved", 403);

    const url = new URL(request.url);
    const year = url.searchParams.get("year");
    const teamLeaderUid = url.searchParams.get("teamLeaderUid");

    const filters = [];
    if (year) filters.push(`year=eq.${encodeURIComponent(year)}`);
    if (teamLeaderUid) filters.push(`submitted_by_uid=eq.${encodeURIComponent(teamLeaderUid)}`);
    // Employees may only ever see their own leave.
    if (me.role === "employee") filters.push(`employee_id=eq.${encodeURIComponent(me.employee_id || "")}`);

    const query = `?select=*${filters.length ? "&" + filters.join("&") : ""}&order=start_date.desc`;
    const rows = await supabaseJson(env, { table: "leave_entries", query });
    return json(rows.map(toEntry));
  } catch (err) {
    return errorResponse(err);
  }
}

export async function onRequestPost(context) {
  const { request, env } = context;
  try {
    const caller = await verifyFirebaseToken(request, env);
    const me = await getCallerRole(env, caller.uid);
    if (!me || !["admin", "team_leader"].includes(me.role)) throw new AuthError("Team leaders and admins only", 403);

    const body = await request.json();
    const required = ["employeeId", "employeeName", "daysCount", "startDate", "endDate", "weekStart", "weekEnd", "month", "year"];
    for (const key of required) {
      if (body[key] === undefined || body[key] === null || body[key] === "") {
        throw new AuthError(`${key} is required`, 400);
      }
    }

    const row = {
      employee_id: String(body.employeeId),
      employee_name: body.employeeName,
      position: body.position || "",
      sector: body.sector || "",
      department: body.department || "",
      days_count: Number(body.daysCount),
      start_date: body.startDate,
      end_date: body.endDate,
      week_start: body.weekStart,
      week_end: body.weekEnd,
      month: Number(body.month),
      year: Number(body.year),
      submitted_by_uid: caller.uid,
      submitted_by_name: body.submittedByName || caller.email,
    };
    const [created] = await supabaseJson(env, { table: "leave_entries", method: "POST", body: [row] });
    return json(toEntry(created));
  } catch (err) {
    return errorResponse(err);
  }
}

export async function onRequestDelete(context) {
  const { request, env } = context;
  try {
    const caller = await verifyFirebaseToken(request, env);
    const me = await getCallerRole(env, caller.uid);
    if (!me) throw new AuthError("Not found", 404);

    const url = new URL(request.url);
    const id = url.searchParams.get("id");
    if (!id) throw new AuthError("id is required", 400);

    if (me.role !== "admin") {
      const [existing] = await supabaseJson(env, {
        table: "leave_entries",
        query: `?id=eq.${encodeURIComponent(id)}&select=submitted_by_uid`,
      });
      if (!existing || existing.submitted_by_uid !== caller.uid) throw new AuthError("Not allowed", 403);
    }

    await supabaseJson(env, { table: "leave_entries", method: "DELETE", query: `?id=eq.${encodeURIComponent(id)}` });
    return json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}

function toEntry(row) {
  return {
    entryId: row.id,
    employeeId: row.employee_id,
    employeeName: row.employee_name,
    position: row.position,
    sector: row.sector,
    department: row.department,
    daysCount: Number(row.days_count),
    startDate: row.start_date,
    endDate: row.end_date,
    weekStart: row.week_start,
    weekEnd: row.week_end,
    month: row.month,
    year: row.year,
    submittedByUid: row.submitted_by_uid,
    submittedByName: row.submitted_by_name,
    submittedAt: row.submitted_at,
  };
}
