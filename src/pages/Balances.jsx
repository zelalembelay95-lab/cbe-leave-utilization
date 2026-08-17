import { useEffect, useMemo, useState } from "react";
import { watchLeaveEntries, watchEmployees } from "../services/db";
import { computeAnnualBalance } from "../utils/leaveEngine";
import { currentYear } from "../utils/dateWeek";
import StatCard from "../components/ui/StatCard";
import EmptyState from "../components/ui/EmptyState";

export default function Balances() {
  const [employees, setEmployees] = useState([]);
  const [entries, setEntries] = useState([]);
  const [year, setYear] = useState(currentYear());

  useEffect(() => watchEmployees(setEmployees), []);
  useEffect(() => watchLeaveEntries(setEntries, { year }), [year]);

  const rows = useMemo(
    () =>
      employees
        .map((emp) => ({ employee: emp, balance: computeAnnualBalance(emp, entries, year) }))
        .sort((a, b) => a.employee.fullName.localeCompare(b.employee.fullName)),
    [employees, entries, year]
  );

  const totals = useMemo(
    () =>
      rows.reduce(
        (acc, r) => ({
          netAccrual: acc.netAccrual + r.balance.netAccrual,
          taken: acc.taken + r.balance.takenSinceImport,
          expiring: acc.expiring + r.balance.expiringDecember,
        }),
        { netAccrual: 0, taken: 0, expiring: 0 }
      ),
    [rows]
  );

  const yearEnded = year < currentYear() || (year === currentYear() && new Date().getMonth() === 11 && new Date().getDate() >= 31);

  function exportCsv() {
    const header = ["ID", "Employee", "Net Accrual (HR)", "Taken via app", "Remaining", yearEnded ? "Expired in December" : "At risk of expiring (Dec 31)", "Net balance"];
    const data = rows.map((r) => [
      r.employee.id,
      r.employee.fullName,
      r.balance.netAccrual,
      r.balance.takenSinceImport,
      r.balance.netRemaining,
      r.balance.expiringDecember,
      r.balance.netBalance,
    ]);
    const csv = [header, ...data].map((r) => r.map(csvCell).join(",")).join("\n");
    downloadFile(csv, `Leave-Balances_${year}.csv`, "text/csv");
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display text-2xl font-semibold text-cbe-ink">Leave Balances</h1>
          <p className="text-cbe-slate text-sm mt-1">
            HR's net leave accrual per employee, reduced by leave submitted through this app. Unused balance in the
            "expiring" bucket is lost on December 31 — no carry-over.
          </p>
        </div>
        <div className="flex items-end gap-3">
          <div>
            <label className="label">Year</label>
            <input type="number" className="input w-28" value={year} onChange={(e) => setYear(Number(e.target.value))} />
          </div>
          <button onClick={exportCsv} className="btn-gold h-[42px]" disabled={!rows.length}>
            Export CSV
          </button>
        </div>
      </div>

      <div className="grid sm:grid-cols-3 gap-4 mb-6">
        <StatCard tone="purple" label="Total net accrual" value={`${round(totals.netAccrual)} days`} sub={`Across ${rows.length} employees`} />
        <StatCard tone="white" label="Taken since HR import" value={`${round(totals.taken)} days`} sub="Submitted via this app" />
        <StatCard
          tone="gold"
          label={yearEnded ? "Expired in December" : "At risk of expiring"}
          value={`${round(totals.expiring)} days`}
          sub="No carry-over past Dec 31"
        />
      </div>

      {!rows.length ? (
        <EmptyState title="No employees found" body="Add employees under Admin → Employees to see balances here." />
      ) : (
        <div className="table-shell">
          <table className="report">
            <thead>
              <tr>
                <th>ID</th>
                <th>Employee</th>
                <th>Net accrual</th>
                <th>Taken via app</th>
                <th>Remaining</th>
                <th>{yearEnded ? "Expired in Dec" : "At risk (Dec 31)"}</th>
                <th>Net balance</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ employee, balance }) => (
                <tr key={employee.id}>
                  <td className="font-mono text-xs">{employee.id}</td>
                  <td className="font-medium">{employee.fullName}</td>
                  <td>{balance.netAccrual}</td>
                  <td>{balance.takenSinceImport}</td>
                  <td>{balance.netRemaining}</td>
                  <td className={balance.expiringDecember > 0 ? "text-red-600 font-semibold" : "text-emerald-700"}>
                    {balance.expiringDecember}
                  </td>
                  <td className="font-semibold">{balance.netBalance}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-xs text-cbe-slate mt-4">
        "Net accrual" and the December-expiring amount come from HR's leave export. "Taken via app" is leave
        submitted here since that export, applied against the expiring bucket first. Before December 31, the
        expiring column is a live forecast; an employee who used it all shows <strong>0</strong>. After December 31
        it becomes the actual amount lost, and net balance reflects only the portion that survives.
      </p>
    </div>
  );
}

function round(n) {
  return Math.round(n * 100) / 100;
}

function csvCell(v) {
  const s = String(v ?? "");
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function downloadFile(content, filename, mime) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
