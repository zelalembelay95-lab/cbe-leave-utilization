import { verifyFirebaseToken, json, errorResponse, AuthError } from "../_lib/firebaseAuth.js";
import { supabaseJson } from "../_lib/supabase.js";
import { getCallerRole } from "../_lib/authz.js";

// GET    /api/employees       -> list (any signed-in, approved user)
// POST   /api/employees       -> upsert one employee (admin only)
// DELETE /api/employees?id=.. -> remove (admin only)
export async function onRequestGet(context) {
  const { request, env } = context;
  try {
    const caller = await verifyFirebaseToken(request, env);
    const me = await getCallerRole(env, caller.uid);
    if (!me || me.role === "pending") throw new AuthError("Account not yet approved", 403);

    const rows = await supabaseJson(env, { table: "employees", query: "?select=*&order=full_name.asc" });
    return json(rows.map(toEmployee));
  } catch (err) {
    return errorResponse(err);
  }
}

export async function onRequestPost(context) {
  const { request, env } = context;
  try {
    const caller = await verifyFirebaseToken(request, env);
    const me = await getCallerRole(env, caller.uid);
    if (!me || me.role !== "admin") throw new AuthError("Admins only", 403);

    const body = await request.json();
    if (!body.id || !body.fullName) throw new AuthError("id and fullName are required", 400);

    const row = {
      id: String(body.id),
      full_name: body.fullName,
      position: body.position || "",
      department: body.department || "",
      sector: body.sector || "",
      division: body.division || "",
      net_accrual_tillnow: Number(body.netAccrualTillNow) || 0,
      leave_expiring_dec31: Number(body.leaveExpiringDec31) || 0,
      status: body.status || "active",
    };
    await supabaseJson(env, {
      table: "employees",
      method: "POST",
      headers: { Prefer: "resolution=merge-duplicates,return=representation" },
      body: [row],
    });
    return json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function onRequestDelete(context) {
  const { request, env } = context;
  try {
    const caller = await verifyFirebaseToken(request, env);
    const me = await getCallerRole(env, caller.uid);
    if (!me || me.role !== "admin") throw new AuthError("Admins only", 403);

    const url = new URL(request.url);
    const id = url.searchParams.get("id");
    if (!id) throw new AuthError("id is required", 400);

    await supabaseJson(env, { table: "employees", method: "DELETE", query: `?id=eq.${encodeURIComponent(id)}` });
    return json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}

function toEmployee(row) {
  return {
    id: row.id,
    fullName: row.full_name,
    position: row.position,
    department: row.department,
    sector: row.sector,
    division: row.division,
    netAccrualTillNow: Number(row.net_accrual_tillnow),
    leaveExpiringDec31: Number(row.leave_expiring_dec31),
    status: row.status,
  };
} 
