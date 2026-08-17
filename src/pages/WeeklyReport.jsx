import { useEffect, useMemo, useState } from "react";
import { watchLeaveEntries } from "../services/db";
import { mondayOf, saturdayOf, formatLong, formatShort } from "../utils/dateWeek";
import { buildWeeklyReport } from "../utils/leaveEngine";
import EmptyState from "../components/ui/EmptyState";
import { useAuth } from "../context/AuthContext";

export default function WeeklyReport() {
  const { profile } = useAuth();
  const [entries, setEntries] = useState([]);
  const [weekStart, setWeekStart] = useState(mondayOf(new Date()));

  useEffect(() => {
    const opts = profile.role === "team_leader" ? { teamLeaderUid: profile.uid } : {};
    return watchLeaveEntries(setEntries, opts);
  }, [profile]);

  const report = useMemo(() => buildWeeklyReport(entries, weekStart), [entries, weekStart]);

  function exportCsv() {
    const header = ["S.N", "ID", "Employee full name", "Sector/Division", "Department/Unit", "Position", "#Days", "Start", "End", "Total"];
    const rows = report.rows.map((r) => [r.sn, r.id, r.name, r.sector, r.department, r.position, r.days, r.start, r.end, r.total]);
    const csv = [header, ...rows].map((r) => r.map(csvCell).join(",")).join("\n");
    downloadFile(csv, `Weekly-Leave-Report_${report.weekStart}_to_${report.weekEnd}.csv`, "text/csv");
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display text-2xl font-semibold text-cbe-ink">Weekly Report on Employees Leave Utilization</h1>
          <p className="text-cbe-slate text-sm mt-1">
            Commercial Bank of Ethiopia · NHQ - Building Maintenance and Property Management Division
          </p>
        </div>
        <div className="flex items-end gap-3">
          <div>
            <label className="label">Reporting week</label>
            <input
              type="date"
              className="input"
              value={weekStart}
              onChange={(e) => setWeekStart(mondayOf(e.target.value))}
            />
          </div>
          <button onClick={exportCsv} className="btn-gold h-[42px]" disabled={!report.rows.length}>
            Export CSV
          </button>
        </div>
      </div>

      <p className="text-sm text-cbe-ink font-medium mb-3">
        Employees on leave during the week dated {formatLong(report.weekStart)} to {formatLong(report.weekEnd)}
      </p>

      {!report.rows.length ? (
        <EmptyState title="No leave recorded this week" body="Once team leaders submit entries for this reporting week, they'll appear here." />
      ) : (
        <div className="table-shell">
          <table className="report">
            <thead>
              <tr>
                <th>S.N</th>
                <th>ID</th>
                <th>Employee full name</th>
                <th>Sector/Division</th>
                <th>Department/Unit</th>
                <th>Position</th>
                <th># Days</th>
                <th>Start date</th>
                <th>End date</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {report.rows.map((r) => (
                <tr key={`${r.id}-${r.sn}`}>
                  <td>{r.sn}</td>
                  <td className="font-mono text-xs">{r.id}</td>
                  <td className="font-medium">{r.name}</td>
                  <td>{r.sector}</td>
                  <td>{r.department}</td>
                  <td>{r.position}</td>
                  <td>{r.days}</td>
                  <td>{formatShort(r.start)}</td>
                  <td>{formatShort(r.end)}</td>
                  <td className="font-semibold">{r.total}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={9} className="text-right font-semibold">Total leave days for the week</td>
                <td className="font-display font-semibold text-cbe-purple-800">{report.totalDays}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      <p className="text-xs text-cbe-slate mt-4">
        Note: employees who have returned from leave and are back at work are excluded. Employees whose leave extends
        beyond a week remain included in the following week's report.
      </p>
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
