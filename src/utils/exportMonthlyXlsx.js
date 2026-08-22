import ExcelJS from "exceljs";
import { monthLabel } from "./dateWeek";
import { writeLeaveReportSheet } from "./writeReportSheet";
import { downloadWorkbook } from "./xlsxStyle";

export async function exportMonthlyReportXlsx(report, division = "NHQ - Building Maintenance and Property Management Division") {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Monthly Leave Report", { views: [{ showGridLines: false }] });

  writeLeaveReportSheet(ws, {
    titleLines: [
      "Commercial Bank of Ethiopia",
      division,
      "Monthly Report on Employees Leave Utilization",
      `Employees on Leave during ${monthLabel(report.year, report.month)}`,
    ],
    rows: report.rows,
    totalDays: report.totalDays,
    totalLabel: "Total leave days for the month",
  });

  await downloadWorkbook(wb, `Monthly-Leave-Report_${monthLabel(report.year, report.month).replace(" ", "-")}.xlsx`);
}
