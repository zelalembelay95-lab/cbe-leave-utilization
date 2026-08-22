import ExcelJS from "exceljs";
import { formatLong, formatMonthDayYear } from "./dateWeek";
import { writeLeaveReportSheet } from "./writeReportSheet";
import { downloadWorkbook } from "./xlsxStyle";

export async function exportWeeklyReportXlsx(report, division = "NHQ - Building Maintenance and Property Management Division") {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Weekly Leave Report", { views: [{ showGridLines: false }] });

  writeLeaveReportSheet(ws, {
    titleLines: [
      "Commercial Bank of Ethiopia",
      division,
      "Weekly Report on Employees Leave Utilization",
      `Employees on Leave during the Week dated ${formatLong(report.weekStart)} to ${formatMonthDayYear(report.weekEnd)}`,
    ],
    rows: report.rows,
    totalDays: report.totalDays,
    totalLabel: "Total leave days for the week",
  });

  await downloadWorkbook(wb, `Weekly-Leave-Report_${report.weekStart}_to_${report.weekEnd}.xlsx`);
}
