import { useEffect, useState } from "react";
import { watchUsers, setUserRole, watchEmployees, adminCreateUser } from "../services/db";
import EmptyState from "../components/ui/EmptyState";

const ROLES = [
  { value: "pending", label: "Pending (no access)" },
  { value: "employee", label: "Employee" },
  { value: "team_leader", label: "Team Leader" },
  { value: "manager", label: "Manager" },
  { value: "admin", label: "Admin" },
];

const CREATABLE_ROLES = ROLES.filter((r) => r.value !== "pending");

const BLANK_NEW_USER = { displayName: "", email: "", password: "", role: "team_leader", employeeId: "" };

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [newUser, setNewUser] = useState(BLANK_NEW_USER);
  const [creating, setCreating] = useState(false);
  const [createMsg, setCreateMsg] = useState(null);

  useEffect(() => watchUsers(setUsers), []);
  useEffect(() => watchEmployees(setEmployees), []);

  async function changeRole(uid, role) {
    await setUserRole(uid, role, role === "employee" ? {} : { employeeId: null });
  }

  async function linkEmployee(uid, employeeId) {
    await setUserRole(uid, "employee", { employeeId: employeeId || null });
  }

  async function handleCreateUser(e) {
    e.preventDefault();
    setCreating(true);
    setCreateMsg(null);
    try {
      await adminCreateUser(newUser);
      setCreateMsg({ type: "success", text: `Account created for ${newUser.email}. Share the password with them directly — they can sign in right away.` });
      setNewUser(BLANK_NEW_USER);
    } catch (err) {
      setCreateMsg({ type: "error", text: err.message || "Could not create account." });
    } finally {
      setCreating(false);
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-semibold text-cbe-ink">Users &amp; Roles</h1>
        <p className="text-cbe-slate text-sm mt-1">
          Create accounts directly with a chosen role, or approve people who signed themselves up from the login
          screen.
        </p>
      </div>

      <div className="grid lg:grid-cols-[380px_1fr] gap-6">
        <form onSubmit={handleCreateUser} className="card space-y-4 h-fit">
          <h2 className="font-display font-semibold">Create a user directly</h2>
          <p className="text-xs text-cbe-slate -mt-2">
            Set their email and password yourself, pick their role up front, and share the credentials with them —
            no approval step needed.
          </p>
          <div>
            <label className="label">Full name</label>
            <input
              className="input"
              value={newUser.displayName}
              onChange={(e) => setNewUser({ ...newUser, displayName: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="label">Work email</label>
            <input
              type="email"
              className="input"
              value={newUser.email}
              onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="label">Password</label>
            <input
              type="text"
              className="input font-mono"
              value={newUser.password}
              onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
              minLength={6}
              required
              placeholder="Min. 6 characters"
            />
          </div>
          <div>
            <label className="label">Role</label>
            <select className="input" value={newUser.role} onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}>
              {CREATABLE_ROLES.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>
          {newUser.role === "employee" && (
            <div>
              <label className="label">Linked employee record</label>
              <select
                className="input"
                value={newUser.employeeId}
                onChange={(e) => setNewUser({ ...newUser, employeeId: e.target.value })}
              >
                <option value="">Not linked</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.id} – {emp.fullName}
                  </option>
                ))}
              </select>
            </div>
          )}
          {createMsg && (
            <p className={`text-sm ${createMsg.type === "success" ? "text-emerald-700" : "text-red-600"}`}>
              {createMsg.text}
            </p>
          )}
          <button type="submit" disabled={creating} className="btn-primary w-full">
            {creating ? "Creating…" : "Create account"}
          </button>
        </form>

        <div>
          <h2 className="font-display font-semibold text-lg mb-3">All accounts</h2>
          {!users.length ? (
            <EmptyState title="No accounts yet" body="Create one on the left, or wait for people to sign up from the login screen for you to approve here." />
          ) : (
            <div className="table-shell">
              <table className="report">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Linked employee (for "Employee" role)</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.uid}>
                      <td className="font-medium">{u.displayName || "—"}</td>
                      <td className="text-xs">{u.email}</td>
                      <td>
                        <select
                          className="input py-1.5 text-xs w-44"
                          value={u.role || "pending"}
                          onChange={(e) => changeRole(u.uid, e.target.value)}
                        >
                          {ROLES.map((r) => (
                            <option key={r.value} value={r.value}>
                              {r.label}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td>
                        {u.role === "employee" ? (
                          <select
                            className="input py-1.5 text-xs w-56"
                            value={u.employeeId || ""}
                            onChange={(e) => linkEmployee(u.uid, e.target.value)}
                          >
                            <option value="">Not linked</option>
                            {employees.map((emp) => (
                              <option key={emp.id} value={emp.id}>
                                {emp.id} – {emp.fullName}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span className="text-xs text-cbe-slate">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
