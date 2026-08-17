import { auth } from "../firebase";

async function authHeaders() {
  const user = auth.currentUser;
  if (!user) throw new Error("Not signed in");
  const token = await user.getIdToken();
  return { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
}

export async function apiGet(path) {
  const res = await fetch(path, { headers: await authHeaders() });
  return handle(res);
}

export async function apiPost(path, body) {
  const res = await fetch(path, { method: "POST", headers: await authHeaders(), body: JSON.stringify(body) });
  return handle(res);
}

export async function apiDelete(path) {
  const res = await fetch(path, { method: "DELETE", headers: await authHeaders() });
  return handle(res);
}

async function handle(res) {
  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      if (body?.error) message = body.error;
    } catch {
      /* ignore */
    }
    throw new Error(message);
  }
  if (res.status === 204) return null;
  return res.json();
}
