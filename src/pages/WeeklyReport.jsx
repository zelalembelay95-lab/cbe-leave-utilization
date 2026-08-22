import { useEffect, useMemo, useState } from "react";
import { watchLeaveEntries } from "../services/db";
import { startOfReportWeek, formatLong, formatMonthDayYear } from "../utils/dateWeek";
import { buildWeeklyReport } from "../utils/leaveEngine";
import LeaveReportTable from "../components/reports/LeaveReportTable";
import { useAuth } from "../context/AuthContext";

export default function WeeklyReport() {
  const { profile } = useAuth();
  const [entries, setEntries] = useState([]);
  const [weekStart, setWeekStart] = useState(startOfReportWeek(new Date()));
  const [exporting, setExporting] = useState(false);

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

  async function exportExcel() {
    setExporting(true);
    try {
      const { exportWeeklyReportXlsx } = await import("../utils/exportWeeklyXlsx");
      await exportWeeklyReportXlsx(report);
    } finally {
      setExporting(false);
    }
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
            <label className="label">Reporting week (Monday–Saturday)</label>
            <input
              type="date"
              className="input"
              value={weekStart}
              onChange={(e) => setWeekStart(startOfReportWeek(e.target.value))}
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
            {exporting ? "Preparing…" : "Export for HRBP (.xlsx)"}
          </button>
        </div>
      </div>

      <p className="text-sm text-cbe-ink font-medium mb-3">
        Employees on Leave during the Week dated {formatLong(report.weekStart)} to {formatMonthDayYear(report.weekEnd)}
      </p>

      <LeaveReportTable
        rows={report.rows}
        totalDays={report.totalDays}
        emptyTitle="No leave recorded this week"
        emptyBody="Once team leaders submit entries for this reporting week, they'll appear here."
      />
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
