// Verifies a Firebase Authentication ID token on the server (inside a
// Cloudflare Pages Function) using Google's public JWKS — no Firebase Admin
// SDK and no Firebase "Blaze" billing plan required. This is what lets us
// safely trust "who the user is" before touching the Supabase database with
// the service-role key.
import { createRemoteJWKSet, jwtVerify } from "jose";

const JWKS_URL = "https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com";
let jwks;

export async function verifyFirebaseToken(request, env) {
  const auth = request.headers.get("Authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!token) throw new AuthError("Missing Authorization header", 401);

  const projectId = env.FIREBASE_PROJECT_ID;
  if (!projectId) throw new AuthError("Server misconfigured: FIREBASE_PROJECT_ID not set", 500);

  if (!jwks) jwks = createRemoteJWKSet(new URL(JWKS_URL));

  try {
    const { payload } = await jwtVerify(token, jwks, {
      issuer: `https://securetoken.google.com/${projectId}`,
      audience: projectId,
    });
    return { uid: payload.sub, email: payload.email, name: payload.name };
  } catch (err) {
    throw new AuthError("Invalid or expired token", 401);
  }
}

export class AuthError extends Error {
  constructor(message, status = 401) {
    super(message);
    this.status = status;
  }
}

export function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export function errorResponse(err) {
  const status = err instanceof AuthError ? err.status : err.status || 500;
  return json({ error: err.message || "Server error" }, status);
}
