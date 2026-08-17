import { apiGet, apiPost, apiDelete } from "./apiClient";

const POLL_MS = 15000; // simulate "live" updates by refetching periodically

function poll(fetcher, cb) {
  let cancelled = false;
  async function run() {
    try {
      const data = await fetcher();
      if (!cancelled) cb(data);
    } catch (err) {
      // Swallow transient errors (e.g. token refresh mid-flight); next poll retries.
      // eslint-disable-next-line no-console
      console.warn("[CBE Leave] refresh failed:", err.message);
    }
  }
  run();
  const id = setInterval(run, POLL_MS);
  return () => {
    cancelled = true;
    clearInterval(id);
  };
}

/* ---------------------------- Users / Roles ---------------------------- */

export async function bootstrapUserProfile() {
  return apiGet("/api/users?action=bootstrap");
}

export function watchUsers(cb) {
  return poll(() => apiGet("/api/users"), cb);
}

export async function setUserRole(uid, role, extra = {}) {
  await apiPost("/api/users", { uid, role, ...extra });
}

export async function adminCreateUser({ email, password, displayName, role, employeeId }) {
  return apiPost("/api/admin-create-user", { email, password, displayName, role, employeeId });
}

/* -------------------------------- Employees ------------------------------ */

export function watchEmployees(cb) {
  return poll(() => apiGet("/api/employees"), cb);
}

export async function upsertEmployee(employee) {
  await apiPost("/api/employees", employee);
}

export async function deleteEmployee(employeeId) {
  await apiDelete(`/api/employees?id=${encodeURIComponent(employeeId)}`);
}

export async function getAllEmployeesOnce() {
  return apiGet("/api/employees");
}

/* ------------------------------ Leave entries ----------------------------- */

export function watchLeaveEntries(cb, { teamLeaderUid = null, year = null } = {}) {
  const params = new URLSearchParams();
  if (teamLeaderUid) params.set("teamLeaderUid", teamLeaderUid);
  if (year) params.set("year", year);
  const qs = params.toString();
  return poll(() => apiGet(`/api/leave-entries${qs ? `?${qs}` : ""}`), cb);
}

export async function addLeaveEntry(entry) {
  await apiPost("/api/leave-entries", entry);
}

export async function deleteLeaveEntry(entryId) {
  await apiDelete(`/api/leave-entries?id=${encodeURIComponent(entryId)}`);
}
