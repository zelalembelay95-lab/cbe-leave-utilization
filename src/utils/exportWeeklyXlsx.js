import ExcelJS from "exceljs";
import { formatLong, formatMonthDayYear } from "./dateWeek";
import {
  TITLE_FONT,
  HEADER_FONT,
  DATA_FONT,
  GOLD_FILL,
  GRAY_FILL,
  THIN_BORDER,
  CENTER,
  LEFT,
  styleTitleRow,
  styleHeaderCell,
  downloadWorkbook,
} from "./xlsxStyle";

const COLS = 10; // S.N .. Total

export async function exportWeeklyReportXlsx(report, division = "NHQ - Building Maintenance and Property Management Division") {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Weekly Leave Report", {
    views: [{ showGridLines: false }],
  });

  ws.columns = [
    { width: 6 }, { width: 12 }, { width: 30 }, { width: 22 }, { width: 26 },
    { width: 32 }, { width: 20 }, { width: 16 }, { width: 16 }, { width: 10 },
  ];

  // Title block (rows 1-4)
  ws.getRow(1).getCell(1).value = "Commercial Bank of Ethiopia";
  ws.getRow(2).getCell(1).value = division;
  ws.getRow(3).getCell(1).value = "Weekly Report on Employees Leave Utilization";
  ws.getRow(4).getCell(1).value =
    `Employees on Leave during the Week dated ${formatLong(report.weekStart)} to ${formatMonthDayYear(report.weekEnd)}`;
  [1, 2, 3, 4].forEach((r) => {
    styleTitleRow(ws, r, COLS);
    ws.getRow(r).height = 23;
  });

  // Header (rows 5-6, merged)
  const headerLabels = ["S.N", "ID", "Employee full name", "Sector/Division", "Department/Unit", "Position"];
  headerLabels.forEach((label, i) => {
    ws.getCell(5, i + 1).value = label;
    ws.mergeCells(5, i + 1, 6, i + 1);
  });
  ws.getCell(5, 7).value = "Leave Utilized";
  ws.mergeCells(5, 7, 5, 10);
  const subLabels = ["#No. of Days on Leave (Leave Approved on Oracle)", "Leave Start Date", "Leave End Date", "Total"];
  subLabels.forEach((label, i) => {
    ws.getCell(6, i + 7).value = label;
  });
  for (let r = 5; r <= 6; r++) {
    for (let c = 1; c <= COLS; c++) styleHeaderCell(ws, r, c);
  }
  ws.getRow(5).height = 22;
  ws.getRow(6).height = 48;

  // Data rows
  let r = 7;
  for (const row of report.rows) {
    const values = [row.sn, row.id, row.name, row.sector, row.department, row.position, row.days, formatMonthDayYear(row.start), formatMonthDayYear(row.end), row.total];
    values.forEach((v, i) => {
      const cell = ws.getCell(r, i + 1);
      cell.value = v;
      cell.font = DATA_FONT;
      cell.border = THIN_BORDER;
      cell.alignment = i === 5 ? LEFT : CENTER; // Position column left-aligned
      if (i === 6 || i === 9) cell.fill = GRAY_FILL; // Days / Total columns
    });
    ws.getRow(r).height = 26;
    r++;
  }

  // Total row
  ws.mergeCells(r, 1, r, 9);
  ws.getCell(r, 1).value = "Total leave days for the week";
  ws.getCell(r, 1).font = { ...HEADER_FONT };
  ws.getCell(r, 1).alignment = { horizontal: "right", vertical: "middle" };
  ws.getCell(r, 10).value = report.totalDays;
  ws.getCell(r, 10).font = HEADER_FONT;
  ws.getCell(r, 10).fill = GOLD_FILL;
  ws.getCell(r, 10).border = THIN_BORDER;
  ws.getCell(r, 10).alignment = CENTER;
  r += 2;

  ws.mergeCells(r, 1, r, COLS);
  ws.getCell(r, 1).value = "Supervisor Name and Position: ____________________________";
  ws.getCell(r, 1).font = DATA_FONT;
  r += 2;

  const notes = [
    "Note: Employees who have returned from leave and are on work in the reporting week shall be excluded from the report",
    "Whereas, Employees whose leave extended beyond a week and are still on leave shall be included and remain in the report",
    "The Report Shall be sent Every Friday to the HRBP Department",
  ];
  notes.forEach((note, i) => {
    ws.mergeCells(r + i, 1, r + i, COLS);
    const cell = ws.getCell(r + i, 1);
    cell.value = note;
    cell.font = { ...DATA_FONT, size: 10, italic: true };
  });

  await downloadWorkbook(wb, `Weekly-Leave-Report_${report.weekStart}_to_${report.weekEnd}.xlsx`);
}
