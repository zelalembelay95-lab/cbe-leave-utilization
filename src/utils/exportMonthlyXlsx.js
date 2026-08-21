import ExcelJS from "exceljs";
import { monthLabel } from "./dateWeek";
import {
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

const COLS = 7; // ID .. Total days

export async function exportMonthlyReportXlsx(report, division = "NHQ - Building Maintenance and Property Management Division") {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Monthly Leave Report", { views: [{ showGridLines: false }] });

  ws.columns = [
    { width: 12 }, { width: 30 }, { width: 22 }, { width: 26 },
    { width: 32 }, { width: 14 }, { width: 14 },
  ];

  ws.getRow(1).getCell(1).value = "Commercial Bank of Ethiopia";
  ws.getRow(2).getCell(1).value = division;
  ws.getRow(3).getCell(1).value = "Monthly Report on Employees Leave Utilization";
  ws.getRow(4).getCell(1).value = `Employees on Leave during ${monthLabel(report.year, report.month)}`;
  [1, 2, 3, 4].forEach((r) => {
    styleTitleRow(ws, r, COLS);
    ws.getRow(r).height = 23;
  });

  const headers = ["ID", "Employee full name", "Sector/Division", "Department/Unit", "Position", "Leave entries", "Total days"];
  headers.forEach((label, i) => {
    ws.getCell(5, i + 1).value = label;
    styleHeaderCell(ws, 5, i + 1);
  });
  ws.getRow(5).height = 36;

  let r = 6;
  for (const row of report.rows) {
    const values = [row.id, row.name, row.sector, row.department, row.position, row.entryCount, row.totalDays];
    values.forEach((v, i) => {
      const cell = ws.getCell(r, i + 1);
      cell.value = v;
      cell.font = DATA_FONT;
      cell.border = THIN_BORDER;
      cell.alignment = i === 4 ? LEFT : CENTER;
      if (i === 5 || i === 6) cell.fill = GRAY_FILL;
    });
    ws.getRow(r).height = 24;
    r++;
  }

  ws.mergeCells(r, 1, r, 6);
  ws.getCell(r, 1).value = "Grand total leave days";
  ws.getCell(r, 1).font = HEADER_FONT;
  ws.getCell(r, 1).alignment = { horizontal: "right", vertical: "middle" };
  ws.getCell(r, 7).value = report.totalDays;
  ws.getCell(r, 7).font = HEADER_FONT;
  ws.getCell(r, 7).fill = GOLD_FILL;
  ws.getCell(r, 7).border = THIN_BORDER;
  ws.getCell(r, 7).alignment = CENTER;

  await downloadWorkbook(wb, `Monthly-Leave-Report_${monthLabel(report.year, report.month).replace(" ", "-")}.xlsx`);
}
