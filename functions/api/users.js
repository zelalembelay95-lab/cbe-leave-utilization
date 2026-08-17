import { verifyFirebaseToken, json, errorResponse, AuthError } from "../_lib/firebaseAuth.js";
import { supabaseJson } from "../_lib/supabase.js";
import { getCallerRole } from "../_lib/authz.js";

// GET    /api/users                 -> list all users (admin only)
// GET    /api/users?action=bootstrap-> get-or-create the caller's own profile
// POST   /api/users                 -> admin sets someone else's role/employeeId
export async function onRequestGet(context) {
  const { request, env } = context;
  try {
    const caller = await verifyFirebaseToken(request, env);
    const url = new URL(request.url);

    if (url.searchParams.get("action") === "bootstrap") {
      let rows = await supabaseJson(env, {
        table: "app_users",
        query: `?uid=eq.${caller.uid}&select=*`,
      });
      if (!rows.length) {
        rows = await supabaseJson(env, {
          table: "app_users",
          method: "POST",
          body: [
            {
              uid: caller.uid,
              email: caller.email,
              display_name: caller.name || caller.email,
              role: "pending",
              employee_id: null,
            },
          ],
        });
      }
      return json(toProfile(rows[0]));
    }

    const me = await getCallerRole(env, caller.uid);
    if (!me || me.role !== "admin") throw new AuthError("Admins only", 403);

    const rows = await supabaseJson(env, { table: "app_users", query: "?select=*&order=email.asc" });
    return json(rows.map(toProfile));
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
    if (!body.uid) throw new AuthError("uid is required", 400);

    const patch = { role: body.role };
    if ("employeeId" in body) patch.employee_id = body.employeeId || null;

    await supabaseJson(env, {
      table: "app_users",
      method: "PATCH",
      query: `?uid=eq.${encodeURIComponent(body.uid)}`,
      body: patch,
    });
    return json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}

function toProfile(row) {
  if (!row) return null;
  return {
    uid: row.uid,
    email: row.email,
    displayName: row.display_name,
    role: row.role,
    employeeId: row.employee_id,
    createdAt: row.created_at,
  };
}
