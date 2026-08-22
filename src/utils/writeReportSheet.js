import { formatMonthDayYear } from "./dateWeek";
import { computeRuns } from "./reportRuns";
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
} from "./xlsxStyle";

const COLS = 10; // S.N .. Total

/**
 * Writes a full leave report (title block, headers, merged data rows,
 * total, signature line, notes) into a worksheet. Shared by the weekly and
 * monthly exports so they can never drift apart in layout — the only
 * difference between the two is the title lines passed in and which rows
 * were selected before calling this.
 *
 * @param {import('exceljs').Worksheet} ws
 * @param {{ titleLines: string[], rows: Array, totalDays: number, totalLabel: string }} report
 */
export function writeLeaveReportSheet(ws, { titleLines, rows, totalDays, totalLabel }) {
  ws.columns = [
    { width: 6 }, { width: 12 }, { width: 30 }, { width: 22 }, { width: 26 },
    { width: 32 }, { width: 20 }, { width: 16 }, { width: 16 }, { width: 10 },
  ];

  titleLines.forEach((text, i) => {
    const rowNum = i + 1;
    ws.getRow(rowNum).getCell(1).value = text;
    styleTitleRow(ws, rowNum, COLS);
    ws.getRow(rowNum).height = 23;
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

  // Data rows. Cells merge wherever a column's value repeats on
  // consecutive rows — ID/Name/Position merge per employee (their own
  // multiple leave periods); Sector/Department merge across however many
  // rows share the same value, which in practice is everyone.
  const idRuns = computeRuns(rows, (row) => row.id);
  const sectorRuns = computeRuns(rows, (row) => row.sector);
  const departmentRuns = computeRuns(rows, (row) => row.department);

  let r = 7;
  rows.forEach((row, i) => {
    if (idRuns[i] > 1) {
      [1, 2, 3, 6, 10].forEach((col) => ws.mergeCells(r, col, r + idRuns[i] - 1, col));
    }
    if (sectorRuns[i] > 1) ws.mergeCells(r, 4, r + sectorRuns[i] - 1, 4);
    if (departmentRuns[i] > 1) ws.mergeCells(r, 5, r + departmentRuns[i] - 1, 5);

    const values = [
      idRuns[i] > 0 ? row.sn : null,
      idRuns[i] > 0 ? row.id : null,
      idRuns[i] > 0 ? row.name : null,
      sectorRuns[i] > 0 ? row.sector : null,
      departmentRuns[i] > 0 ? row.department : null,
      idRuns[i] > 0 ? row.position : null,
      row.days,
      formatMonthDayYear(row.start),
      formatMonthDayYear(row.end),
      idRuns[i] > 0 ? row.total : null,
    ];
    values.forEach((v, c) => {
      const cell = ws.getCell(r, c + 1);
      if (v !== null) cell.value = v;
      cell.font = DATA_FONT;
      cell.border = THIN_BORDER;
      cell.alignment = c === 5 ? LEFT : CENTER; // Position column left-aligned
      if (c === 6 || c === 9) cell.fill = GRAY_FILL; // Days / Total columns
    });
    ws.getRow(r).height = 26;
    r++;
  });

  // Total row
  ws.mergeCells(r, 1, r, 9);
  ws.getCell(r, 1).value = totalLabel;
  ws.getCell(r, 1).font = HEADER_FONT;
  ws.getCell(r, 1).alignment = { horizontal: "right", vertical: "middle" };
  ws.getCell(r, 10).value = totalDays;
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
    "Note: Employees who have returned from leave and are on work in the reporting period shall be excluded from the report",
    "Whereas, Employees whose leave extended beyond the period and are still on leave shall be included and remain in the report",
    "The Report Shall be sent Every Friday to the HRBP Department",
  ];
  notes.forEach((note, i) => {
    ws.mergeCells(r + i, 1, r + i, COLS);
    const cell = ws.getCell(r + i, 1);
    cell.value = note;
    cell.font = { ...DATA_FONT, size: 10, italic: true };
  });
}
