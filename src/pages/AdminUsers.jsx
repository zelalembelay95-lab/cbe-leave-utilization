import { useEffect, useState } from "react";
import { watchUsers, setUserRole, watchEmployees } from "../services/db";
import Badge from "../components/ui/Badge";
import EmptyState from "../components/ui/EmptyState";

const ROLES = [
  { value: "pending", label: "Pending (no access)" },
  { value: "employee", label: "Employee" },
  { value: "team_leader", label: "Team Leader" },
  { value: "manager", label: "Manager" },
  { value: "admin", label: "Admin" },
];

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [employees, setEmployees] = useState([]);

  useEffect(() => watchUsers(setUsers), []);
  useEffect(() => watchEmployees(setEmployees), []);

  async function changeRole(uid, role) {
    await setUserRole(uid, role, role === "employee" ? {} : { employeeId: null });
  }

  async function linkEmployee(uid, employeeId) {
    await setUserRole(uid, "employee", { employeeId: employeeId || null });
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-semibold text-cbe-ink">Users &amp; Roles</h1>
        <p className="text-cbe-slate text-sm mt-1">
          Assign roles to accounts that have signed up. New accounts start as <Badge tone="pending" /> until you
          approve them here.
        </p>
      </div>

      {!users.length ? (
        <EmptyState title="No accounts yet" body="Once people create accounts from the sign-in screen, they'll appear here for approval." />
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
  );
}
