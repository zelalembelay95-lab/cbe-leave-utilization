import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { watchEmployees, addLeaveEntry } from "../services/db";
import { startOfReportWeek, endOfReportWeek, formatLong, toISO } from "../utils/dateWeek";
import { decorateEntryWithWeek, round2 } from "../utils/leaveEngine";
import EmptyState from "../components/ui/EmptyState";

function blankPeriod() {
  return { key: crypto.randomUUID(), days: "", start: "", end: "" };
}

export default function TeamLeaderSubmit() {
  const { profile } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [employeeId, setEmployeeId] = useState("");
  const [weekStart, setWeekStart] = useState(startOfReportWeek(new Date()));
  const [periods, setPeriods] = useState([blankPeriod()]);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => watchEmployees(setEmployees), []);

  const employee = useMemo(() => employees.find((e) => e.id === employeeId), [employees, employeeId]);
  const weekEnd = endOfReportWeek(weekStart);

  function updatePeriod(key, field, value) {
    setPeriods((prev) => prev.map((p) => (p.key === key ? { ...p, [field]: value } : p)));
  }

  function addPeriod() {
    setPeriods((prev) => [...prev, blankPeriod()]);
  }

  function removePeriod(key) {
    setPeriods((prev) => (prev.length > 1 ? prev.filter((p) => p.key !== key) : prev));
  }

  function resetForm() {
    setEmployeeId("");
    setPeriods([blankPeriod()]);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!employee) return;
    setSubmitting(true);
    setToast(null);
    try {
      for (const p of periods) {
        if (!p.days || !p.start || !p.end) continue;
        const base = {
          employeeId: employee.id,
          employeeName: employee.fullName,
          position: employee.position,
          sector: employee.sector,
          department: employee.department,
          daysCount: round2(Number(p.days)),
          startDate: p.start,
          endDate: p.end,
          submittedByUid: profile.uid,
          submittedByName: profile.displayName || profile.email,
        };
        await addLeaveEntry(decorateEntryWithWeek(base, weekStart));
      }
      setToast({ type: "success", text: `Leave recorded for ${employee.fullName}.` });
      resetForm();
    } catch (err) {
      setToast({ type: "error", text: err.message || "Could not submit. Please try again." });
    } finally {
      setSubmitting(false);
    }
  }

  if (!employees.length) {
    return (
      <EmptyState
        title="No employees yet"
        body="Ask an administrator to add employees under Admin → Employees before submitting leave."
      />
    );
  }

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-semibold text-cbe-ink">Weekly Leave Utilization Submission</h1>
        <p className="text-cbe-slate text-sm mt-1">
          Submit approved annual leave (Oracle-approved) for employees under your supervision.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="card space-y-6">
        <div>
          <label className="label">Reporting week</label>
          <input
            type="date"
            className="input max-w-xs"
            value={weekStart}
            onChange={(e) => setWeekStart(startOfReportWeek(e.target.value))}
          />
          <p className="text-xs text-cbe-slate mt-1.5">
            Week of <strong>{formatLong(weekStart)}</strong> – <strong>{formatLong(weekEnd)}</strong>. Pick any day;
            it snaps to that reporting week's Friday–Thursday (HRBP's official week).
          </p>
        </div>

        <div>
          <label className="label">ID, Name and Position</label>
          <select className="input" value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} required>
            <option value="">Select an employee…</option>
            {employees.map((e) => (
              <option key={e.id} value={e.id}>
                {e.id} – {e.fullName} – {e.position}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="label mb-0">Leave entries for this week</label>
            <button type="button" onClick={addPeriod} className="btn-ghost text-xs px-3 py-1.5">
              + Add another leave entry
            </button>
          </div>

          {periods.map((p, idx) => (
            <div key={p.key} className="rounded-xl border border-cbe-purple-100 p-4 relative">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold text-cbe-purple-700">Entry {idx + 1}</p>
                {periods.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removePeriod(p.key)}
                    className="text-xs text-red-600 hover:underline"
                  >
                    Remove
                  </button>
                )}
              </div>
              <div className="grid sm:grid-cols-3 gap-4">
                <div>
                  <label className="label"># of days (Oracle-approved)</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    className="input"
                    value={p.days}
                    onChange={(e) => updatePeriod(p.key, "days", e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="label">Leave start date</label>
                  <input
                    type="date"
                    className="input"
                    value={p.start}
                    onChange={(e) => updatePeriod(p.key, "start", e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="label">Leave end date</label>
                  <input
                    type="date"
                    className="input"
                    value={p.end}
                    onChange={(e) => updatePeriod(p.key, "end", e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {toast && (
          <p className={`text-sm ${toast.type === "success" ? "text-emerald-700" : "text-red-600"}`}>{toast.text}</p>
        )}

        <div className="flex items-center gap-3 pt-2">
          <button type="submit" disabled={submitting || !employeeId} className="btn-primary">
            {submitting ? "Submitting…" : "Submit leave"}
          </button>
          <button type="button" onClick={resetForm} className="btn-ghost">
            Clear form
          </button>
        </div>

        <p className="text-xs text-cbe-slate border-t border-cbe-purple-50 pt-4">
          Reminders: submit approved annual leave only · if leave extends beyond this reporting week, split it and
          report only the days that fall within each week · each submission covers one employee.
        </p>
      </form>
    </div>
  );
}
