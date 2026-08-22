import { useEffect, useMemo, useState } from "react";
import { watchLeaveEntries } from "../services/db";
import { buildMonthlyReport } from "../utils/leaveEngine";
import { currentMonth, currentYear, monthLabel } from "../utils/dateWeek";
import LeaveReportTable from "../components/reports/LeaveReportTable";
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
    const header = ["S.N", "ID", "Employee full name", "Sector/Division", "Department/Unit", "Position", "#Days", "Start", "End", "Total"];
    const rows = report.rows.map((r) => [r.sn, r.id, r.name, r.sector, r.department, r.position, r.days, r.start, r.end, r.total]);
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
          <h1 className="font-display text-2xl font-semibold text-cbe-ink">Monthly Report on Employees Leave Utilization</h1>
          <p className="text-cbe-slate text-sm mt-1">
            Commercial Bank of Ethiopia · NHQ - Building Maintenance and Property Management Division
          </p>
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
            {exporting ? "Preparing…" : "Export for HRBP (.xlsx)"}
          </button>
        </div>
      </div>

      <p className="text-sm text-cbe-ink font-medium mb-3">
        Employees on Leave during {monthLabel(year, month)}
      </p>

      <LeaveReportTable
        rows={report.rows}
        totalDays={report.totalDays}
        emptyTitle="No leave recorded this month"
        emptyBody="This report fills in automatically as weekly leave entries are submitted."
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
