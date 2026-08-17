import { useEffect, useState } from "react";
import { watchEmployees, upsertEmployee, deleteEmployee } from "../services/db";
import { watchUsers } from "../services/db";
import { DIVISION, SECTOR, seedEmployees } from "../data/seedEmployees";
import EmptyState from "../components/ui/EmptyState";

const BLANK = {
  id: "",
  fullName: "",
  position: "",
  department: "",
  sector: SECTOR,
  division: DIVISION,
  netAccrualTillNow: 0,
  leaveExpiringDec31: 0,
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
      await upsertEmployee({
        ...form,
        netAccrualTillNow: Number(form.netAccrualTillNow) || 0,
        leaveExpiringDec31: Number(form.leaveExpiringDec31) || 0,
      });
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
    if (!confirm(`Load/refresh ${seedEmployees.length} employees, including their HR leave balances?`)) return;
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
          <p className="text-cbe-slate text-sm mt-1">
            Manage the roster and each employee's HR leave balance (net accrual and what's expiring in December).
          </p>
        </div>
        <button onClick={handleSeed} disabled={seeding} className="btn-gold">
          {seeding ? "Loading…" : employees.length ? "Reload HR balances" : "Load starter roster"}
        </button>
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

          <div className="rounded-xl bg-cbe-purple-50 p-3.5 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-cbe-purple-800">HR leave balance</p>
            <div>
              <label className="label">Net accrual till now (days)</label>
              <input
                type="number"
                step="0.5"
                className="input"
                value={form.netAccrualTillNow}
                onChange={(e) => setForm({ ...form, netAccrualTillNow: e.target.value })}
                min="0"
              />
            </div>
            <div>
              <label className="label">Of that, expiring Dec 31 if unused (days)</label>
              <input
                type="number"
                step="0.5"
                className="input"
                value={form.leaveExpiringDec31}
                onChange={(e) => setForm({ ...form, leaveExpiringDec31: e.target.value })}
                min="0"
              />
            </div>
            <p className="text-[11px] text-cbe-slate leading-relaxed">
              From HR's export. Leave submitted through this app afterward reduces both figures automatically —
              you don't need to update these by hand for day-to-day leave.
            </p>
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
            <EmptyState title="No employees yet" body="Add your first employee, or load the starter roster with HR balances already filled in." />
          ) : (
            <div className="table-shell">
              <table className="report">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Position</th>
                    <th>Department</th>
                    <th>Net accrual</th>
                    <th>Expiring Dec 31</th>
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
                      <td>{emp.netAccrualTillNow ?? 0} days</td>
                      <td className={emp.leaveExpiringDec31 > 0 ? "text-red-600 font-semibold" : ""}>
                        {emp.leaveExpiringDec31 ?? 0} days
                      </td>
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
