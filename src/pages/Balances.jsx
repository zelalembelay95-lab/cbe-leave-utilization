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
          entitlement: acc.entitlement + r.balance.entitlement,
          taken: acc.taken + r.balance.takenYTD,
          expiring: acc.expiring + r.balance.expiringDecember,
        }),
        { entitlement: 0, taken: 0, expiring: 0 }
      ),
    [rows]
  );

  const yearEnded = year < currentYear() || (year === currentYear() && new Date().getMonth() === 11 && new Date().getDate() >= 31);

  function exportCsv() {
    const header = ["ID", "Employee", "Annual Entitlement", "Leave Taken (YTD)", "Remaining Balance", yearEnded ? "Expired in December" : "Projected Expiring in December", "Net Balance"];
    const data = rows.map((r) => [
      r.employee.id,
      r.employee.fullName,
      r.balance.entitlement,
      r.balance.takenYTD,
      r.balance.remaining,
      r.balance.expiringDecember,
      r.balance.netBalance,
    ]);
    const csv = [header, ...data].map((r) => r.map(csvCell).join(",")).join("\n");
    downloadFile(csv, `Annual-Leave-Balances_${year}.csv`, "text/csv");
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display text-2xl font-semibold text-cbe-ink">Annual Leave Balances</h1>
          <p className="text-cbe-slate text-sm mt-1">
            HR entitlement vs. actual leave taken. Ethiopian annual leave does not carry over — unused days expire on
            December 31.
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
        <StatCard tone="purple" label="Total entitlement" value={`${round(totals.entitlement)} days`} sub={`Across ${rows.length} employees`} />
        <StatCard tone="white" label="Total leave taken" value={`${round(totals.taken)} days`} sub={`Year ${year} to date`} />
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
                <th>Entitlement</th>
                <th>Taken (YTD)</th>
                <th>Remaining</th>
                <th>{yearEnded ? "Expired in Dec" : "Projected expiring"}</th>
                <th>Net balance</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ employee, balance }) => (
                <tr key={employee.id}>
                  <td className="font-mono text-xs">{employee.id}</td>
                  <td className="font-medium">{employee.fullName}</td>
                  <td>{balance.entitlement}</td>
                  <td>{balance.takenYTD}</td>
                  <td>{balance.remaining}</td>
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
        "Projected expiring" shows what would be lost if the remaining balance stays unused through December 31 of
        the selected year. Once the year has ended, the same column shows the actual number of days that expired,
        and net balance drops to 0 for any unused amount.
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
