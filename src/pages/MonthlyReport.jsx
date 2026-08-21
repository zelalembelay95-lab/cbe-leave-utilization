import { useEffect, useMemo, useState } from "react";
import { watchLeaveEntries } from "../services/db";
import { buildMonthlyReport } from "../utils/leaveEngine";
import { currentMonth, currentYear, monthLabel } from "../utils/dateWeek";
import EmptyState from "../components/ui/EmptyState";
import StatCard from "../components/ui/StatCard";
import { useAuth } from "../context/AuthContext";

const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);

export default function MonthlyReport() {
  const { profile } = useAuth();
  const [entries, setEntries] = useState([]);
  const [year, setYear] = useState(currentYear());
  const [month, setMonth] = useState(currentMonth());
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    const opts = profile.role === "team_leader" ? { teamLeaderUid: profile.uid, year } : { year };
    return watchLeaveEntries(setEntries, opts);
  }, [profile, year]);

  const report = useMemo(() => buildMonthlyReport(entries, year, month), [entries, year, month]);

  function exportCsv() {
    const header = ["ID", "Employee full name", "Sector/Division", "Department/Unit", "Position", "Leave entries", "Total days"];
    const rows = report.rows.map((r) => [r.id, r.name, r.sector, r.department, r.position, r.entryCount, r.totalDays]);
    const csv = [header, ...rows].map((r) => r.map(csvCell).join(",")).join("\n");
    downloadFile(csv, `Monthly-Leave-Report_${monthLabel(year, month)}.csv`, "text/csv");
  }

  async function exportExcel() {
    setExporting(true);
    try {
      const { exportMonthlyReportXlsx } = await import("../utils/exportMonthlyXlsx");
      await exportMonthlyReportXlsx(report);
    } finally {
      setExporting(false);
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display text-2xl font-semibold text-cbe-ink">Monthly Leave Utilization Report</h1>
          <p className="text-cbe-slate text-sm mt-1">Weekly submissions combined into a single monthly summary.</p>
        </div>
        <div className="flex items-end gap-3">
          <div>
            <label className="label">Month</label>
            <select className="input" value={month} onChange={(e) => setMonth(Number(e.target.value))}>
              {MONTHS.map((m) => (
                <option key={m} value={m}>
                  {monthLabel(year, m).split(" ")[0]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Year</label>
            <input
              type="number"
              className="input w-28"
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
            />
          </div>
          <button onClick={exportCsv} className="btn-ghost h-[42px]" disabled={!report.rows.length}>
            CSV
          </button>
          <button
            onClick={exportExcel}
            className="btn-gold h-[42px]"
            disabled={!report.rows.length || exporting}
          >
            {exporting ? "Preparing…" : "Export Excel (.xlsx)"}
          </button>
        </div>
      </div>

      <div className="grid sm:grid-cols-3 gap-4 mb-6">
        <StatCard tone="purple" label={monthLabel(year, month)} value={`${report.totalDays} days`} sub="Total leave utilized" />
        <StatCard tone="white" label="Employees on leave" value={report.employeesOnLeave} sub="Distinct employees this month" />
        <StatCard
          tone="gold"
          label="Top utilizer"
          value={report.rows[0] ? report.rows[0].name.split(" ")[0] : "—"}
          sub={report.rows[0] ? `${report.rows[0].totalDays} days` : "No data yet"}
        />
      </div>

      {!report.rows.length ? (
        <EmptyState title="No leave recorded this month" body="This report fills in automatically as weekly leave entries are submitted." />
      ) : (
        <div className="table-shell">
          <table className="report">
            <thead>
              <tr>
                <th>ID</th>
                <th>Employee full name</th>
                <th>Sector/Division</th>
                <th>Department/Unit</th>
                <th>Position</th>
                <th>Leave entries</th>
                <th>Total days</th>
              </tr>
            </thead>
            <tbody>
              {report.rows.map((r) => (
                <tr key={r.id}>
                  <td className="font-mono text-xs">{r.id}</td>
                  <td className="font-medium">{r.name}</td>
                  <td>{r.sector}</td>
                  <td>{r.department}</td>
                  <td>{r.position}</td>
                  <td>{r.entryCount}</td>
                  <td className="font-semibold">{r.totalDays}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={6} className="text-right font-semibold">Grand total leave days</td>
                <td className="font-display font-semibold text-cbe-purple-800">{report.totalDays}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
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
