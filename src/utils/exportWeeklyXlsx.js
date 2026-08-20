import * as XLSX from "xlsx";
import { formatLong, formatMonthDayYear } from "./dateWeek";

// Recreates the layout of the official HRBP weekly leave utilization
// template: bank name / division / title rows, a two-row header with
// "Leave Utilized" spanning four sub-columns, data rows, a supervisor
// signature line, and the three standard notes.
export function exportWeeklyReportXlsx(report, division = "NHQ - Building Maintenance and Property Management Division") {
  const weekLabel = `Employees on Leave during the Week dated ${formatLong(report.weekStart)} to ${formatMonthDayYear(report.weekEnd)}`;

  const aoa = [
    ["Commercial Bank of Ethiopia"],
    [division],
    ["Weekly Report on Employees Leave Utilization"],
    [weekLabel],
    ["S.N", "ID", "Employee full name", "Sector/Division", "Department/Unit", "Position", "Leave Utilized", "", "", ""],
    ["", "", "", "", "", "", "#No. of Days on Leave (Leave Approved on Oracle)", "Leave Start Date", "Leave End Date", "Total"],
    ...report.rows.map((r) => [
      r.sn,
      r.id,
      r.name,
      r.sector,
      r.department,
      r.position,
      r.days,
      formatMonthDayYear(r.start),
      formatMonthDayYear(r.end),
      r.total,
    ]),
    ["", "", "", "", "", "", "", "", "Total", report.totalDays],
    [],
    ["Supervisor Name and Position: ____________________________"],
    [],
    ["Note: Employees who have returned from leave and are on work in the reporting week shall be excluded from the report"],
    ["Whereas, Employees whose leave extended beyond a week and are still on leave shall be included and remain in the report"],
    ["The Report Shall be sent Every Friday to the HRBP Department"],
  ];

  const ws = XLSX.utils.aoa_to_sheet(aoa);

  const dataRowCount = report.rows.length;
  const totalRow = 6 + dataRowCount; // 0-indexed row of the "Total" line
  const lastDataRow = 5 + dataRowCount; // 0-indexed row of the last data entry

  ws["!merges"] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 9 } }, // bank name
    { s: { r: 1, c: 0 }, e: { r: 1, c: 9 } }, // division
    { s: { r: 2, c: 0 }, e: { r: 2, c: 9 } }, // report title
    { s: { r: 3, c: 0 }, e: { r: 3, c: 9 } }, // week label
    { s: { r: 4, c: 0 }, e: { r: 5, c: 0 } }, // S.N
    { s: { r: 4, c: 1 }, e: { r: 5, c: 1 } }, // ID
    { s: { r: 4, c: 2 }, e: { r: 5, c: 2 } }, // Employee full name
    { s: { r: 4, c: 3 }, e: { r: 5, c: 3 } }, // Sector/Division
    { s: { r: 4, c: 4 }, e: { r: 5, c: 4 } }, // Department/Unit
    { s: { r: 4, c: 5 }, e: { r: 5, c: 5 } }, // Position
    { s: { r: 4, c: 6 }, e: { r: 4, c: 9 } }, // Leave Utilized (spans 4 sub-columns)
    { s: { r: totalRow, c: 0 }, e: { r: totalRow, c: 8 } }, // "Total" label row
    { s: { r: totalRow + 2, c: 0 }, e: { r: totalRow + 2, c: 9 } }, // signature line
    { s: { r: totalRow + 4, c: 0 }, e: { r: totalRow + 4, c: 9 } }, // note 1
    { s: { r: totalRow + 5, c: 0 }, e: { r: totalRow + 5, c: 9 } }, // note 2
    { s: { r: totalRow + 6, c: 0 }, e: { r: totalRow + 6, c: 9 } }, // note 3
  ];

  ws["!cols"] = [
    { wch: 6 },
    { wch: 12 },
    { wch: 30 },
    { wch: 22 },
    { wch: 26 },
    { wch: 32 },
    { wch: 20 },
    { wch: 16 },
    { wch: 16 },
    { wch: 10 },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Weekly Leave Report");
  XLSX.writeFile(wb, `Weekly-Leave-Report_${report.weekStart}_to_${report.weekEnd}.xlsx`);
}
