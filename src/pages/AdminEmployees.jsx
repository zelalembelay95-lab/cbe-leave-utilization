import { useEffect, useState } from "react";
import { watchEmployees, upsertEmployee, deleteEmployee } from "../services/db";
import { watchUsers } from "../services/db";
import { DEFAULT_ANNUAL_ENTITLEMENT, DIVISION, SECTOR, seedEmployees } from "../data/seedEmployees";
import EmptyState from "../components/ui/EmptyState";

const BLANK = {
  id: "",
  fullName: "",
  position: "",
  department: "",
  sector: SECTOR,
  division: DIVISION,
  annualEntitlement: DEFAULT_ANNUAL_ENTITLEMENT,
  status: "active",
};

export default function AdminEmployees() {
  const [employees, setEmployees] = useState([]);
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState(BLANK);
  const [editingId, setEditingId] = useState(null);
  const [busy, setBusy] = useState(false);
  const [seeding, setSeeding] = useState(false);

  useEffect(() => watchEmployees(setEmployees), []);
  useEffect(() => watchUsers(setUsers), []);

  function edit(emp) {
    setEditingId(emp.id);
    setForm(emp);
  }

  function resetForm() {
    setEditingId(null);
    setForm(BLANK);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.id || !form.fullName) return;
    setBusy(true);
    try {
      await upsertEmployee({ ...form, annualEntitlement: Number(form.annualEntitlement) || 0 });
      resetForm();
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm("Remove this employee? Their past leave history is kept for reporting.")) return;
    await deleteEmployee(id);
  }

  async function handleSeed() {
    if (!confirm(`Load ${seedEmployees.length} employees from the roster extracted from your uploaded files?`)) return;
    setSeeding(true);
    try {
      for (const emp of seedEmployees) await upsertEmployee(emp);
    } finally {
      setSeeding(false);
    }
  }

  function teamLeaderFor(empId) {
    const linked = users.find((u) => u.role === "employee" && u.employeeId === empId);
    return linked?.displayName;
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display text-2xl font-semibold text-cbe-ink">Employees</h1>
          <p className="text-cbe-slate text-sm mt-1">Manage the employee roster that team leaders report leave against.</p>
        </div>
        {!employees.length && (
          <button onClick={handleSeed} disabled={seeding} className="btn-gold">
            {seeding ? "Loading roster…" : "Load starter roster"}
          </button>
        )}
      </div>

      <div className="grid lg:grid-cols-[380px_1fr] gap-6">
        <form onSubmit={handleSubmit} className="card space-y-4 h-fit">
          <h2 className="font-display font-semibold">{editingId ? "Edit employee" : "Add employee"}</h2>
          <div>
            <label className="label">Employee ID</label>
            <input
              className="input"
              value={form.id}
              onChange={(e) => setForm({ ...form, id: e.target.value })}
              disabled={Boolean(editingId)}
              placeholder="e.g. 70695"
              required
            />
          </div>
          <div>
            <label className="label">Full name</label>
            <input className="input" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} required />
          </div>
          <div>
            <label className="label">Position</label>
            <input className="input" value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Sector/Division</label>
              <input className="input" value={form.sector} onChange={(e) => setForm({ ...form, sector: e.target.value })} />
            </div>
            <div>
              <label className="label">Department/Unit</label>
              <input className="input" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="label">Annual leave entitlement (days)</label>
            <input
              type="number"
              className="input"
              value={form.annualEntitlement}
              onChange={(e) => setForm({ ...form, annualEntitlement: e.target.value })}
              min="0"
            />
          </div>
          <div>
            <label className="label">Status</label>
            <select className="input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={busy} className="btn-primary">
              {editingId ? "Save changes" : "Add employee"}
            </button>
            {editingId && (
              <button type="button" onClick={resetForm} className="btn-ghost">
                Cancel
              </button>
            )}
          </div>
        </form>

        <div>
          {!employees.length ? (
            <EmptyState title="No employees yet" body="Add your first employee, or load the starter roster extracted from your uploaded files." />
          ) : (
            <div className="table-shell">
              <table className="report">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Position</th>
                    <th>Department</th>
                    <th>Entitlement</th>
                    <th>Status</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {employees.map((emp) => (
                    <tr key={emp.id}>
                      <td className="font-mono text-xs">{emp.id}</td>
                      <td className="font-medium">{emp.fullName}</td>
                      <td>{emp.position}</td>
                      <td>{emp.department}</td>
                      <td>{emp.annualEntitlement} days</td>
                      <td>
                        <span className={`badge ${emp.status === "active" ? "bg-emerald-100 text-emerald-800" : "bg-cbe-purple-100 text-cbe-purple-800"}`}>
                          {emp.status}
                        </span>
                      </td>
                      <td className="whitespace-nowrap">
                        <button onClick={() => edit(emp)} className="text-xs text-cbe-purple-700 hover:underline mr-3">
                          Edit
                        </button>
                        <button onClick={() => handleDelete(emp.id)} className="text-xs text-red-600 hover:underline">
                          Remove
                        </button>
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
