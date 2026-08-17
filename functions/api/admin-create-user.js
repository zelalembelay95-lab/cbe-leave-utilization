import { verifyFirebaseToken, json, errorResponse, AuthError } from "../_lib/firebaseAuth.js";
import { supabaseJson } from "../_lib/supabase.js";
import { getCallerRole } from "../_lib/authz.js";

// POST /api/admin-create-user
// Body: { email, password, displayName, role, employeeId? }
// Admin only. Creates the Firebase Auth account directly (via Firebase's
// public Identity Toolkit REST API — no service account / Admin SDK
// needed) and immediately writes its Supabase profile with the chosen
// role, so the person can sign in right away instead of landing on
// "Awaiting approval".
export async function onRequestPost(context) {
  const { request, env } = context;
  try {
    const caller = await verifyFirebaseToken(request, env);
    const me = await getCallerRole(env, caller.uid);
    if (!me || me.role !== "admin") throw new AuthError("Admins only", 403);

    const body = await request.json();
    const { email, password, displayName, role, employeeId } = body;

    if (!email || !password) throw new AuthError("email and password are required", 400);
    if (password.length < 6) throw new AuthError("Password must be at least 6 characters", 400);
    const validRoles = ["employee", "team_leader", "manager", "admin"];
    if (!validRoles.includes(role)) throw new AuthError("role must be one of: " + validRoles.join(", "), 400);

    const apiKey = env.VITE_FIREBASE_API_KEY;
    if (!apiKey) throw new AuthError("Server misconfigured: VITE_FIREBASE_API_KEY not set", 500);

    // 1. Create the Firebase Auth account.
    const signUpRes = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, returnSecureToken: true }),
      }
    );
    const signUpData = await signUpRes.json();
    if (!signUpRes.ok) {
      const msg = signUpData?.error?.message || "Could not create account";
      throw new AuthError(friendlyFirebaseError(msg), 400);
    }
    const { localId: uid, idToken } = signUpData;

    // 2. Set their display name (uses the fresh idToken from step 1).
    if (displayName) {
      await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:update?key=${apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken, displayName, returnSecureToken: false }),
      });
    }

    // 3. Write their Supabase profile with the chosen role right away —
    // no "pending" approval step needed for admin-created accounts.
    await supabaseJson(env, {
      table: "app_users",
      method: "POST",
      body: [
        {
          uid,
          email,
          display_name: displayName || email,
          role,
          employee_id: role === "employee" ? employeeId || null : null,
        },
      ],
    });

    return json({ ok: true, uid, email, role });
  } catch (err) {
    return errorResponse(err);
  }
}

function friendlyFirebaseError(message) {
  if (message?.includes("EMAIL_EXISTS")) return "An account with this email already exists.";
  if (message?.includes("INVALID_EMAIL")) return "That email address looks invalid.";
  if (message?.includes("WEAK_PASSWORD")) return "Password must be at least 6 characters.";
  return message || "Could not create account.";
}
