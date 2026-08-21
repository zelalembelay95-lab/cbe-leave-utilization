import * as XLSX from "xlsx";
import { startOfReportWeek, endOfReportWeek, toISO } from "./dateWeek";
import { decorateEntryWithWeek, round2 } from "./leaveEngine";

// Recognizes header text regardless of which row/column it's on, so it
// tolerates the same 2-row merged-header layout as the official template
// (and reasonably close variations of it).
const HEADER_PATTERNS = {
  id: /^id$/i,
  name: /employee.*full.*name|full.*name/i,
  sector: /sector|division/i,
  department: /department|unit/i,
  position: /position/i,
  days: /no\.?\s*of\s*days|#.*days/i,
  start: /start.*date/i,
  end: /end.*date/i,
};

/**
 * @param {File} file
 * @param {Array} employees - current roster, used to fill in any blank
 *   sector/department/position/full-name and to flag unrecognized IDs.
 * @returns {Promise<{ rows: Array, errors: Array }>}
 */
export async function parseLeaveExcelFile(file, employees) {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array", cellDates: true });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const grid = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false, defval: "" });

  const employeeById = new Map(employees.map((e) => [String(e.id), e]));

  // Scan the first 10 rows for header labels, wherever they land.
  const colFor = {};
  let lastHeaderRow = 0;
  for (let r = 0; r < Math.min(10, grid.length); r++) {
    for (let c = 0; c < grid[r].length; c++) {
      const text = String(grid[r][c] || "").trim();
      if (!text) continue;
      for (const [key, pattern] of Object.entries(HEADER_PATTERNS)) {
        if (pattern.test(text) && colFor[key] === undefined) {
          colFor[key] = c;
          lastHeaderRow = Math.max(lastHeaderRow, r);
        }
      }
    }
  }

  const missing = ["id", "name", "days", "start", "end"].filter((k) => colFor[k] === undefined);
  if (missing.length) {
    return {
      rows: [],
      errors: [
        `Couldn't find these expected columns in the file: ${missing.join(", ")}. ` +
          "Make sure it has headers like ID, Employee full name, #No. of Days, Leave Start Date, Leave End Date.",
      ],
    };
  }

  const rows = [];
  const errors = [];
  const seenKeys = new Set();

  for (let r = lastHeaderRow + 1; r < grid.length; r++) {
    const line = grid[r];
    if (!line || line.every((v) => String(v).trim() === "")) continue;

    const id = String(line[colFor.id] || "").trim();
    if (!id) continue;

    const daysRaw = line[colFor.days];
    const startRaw = line[colFor.start];
    const endRaw = line[colFor.end];

    const days = round2(Number(daysRaw));
    const start = toDateISO(startRaw);
    const end = toDateISO(endRaw);

    const rowNum = r + 1; // 1-indexed, matches what a person sees in Excel
    if (!days || Number.isNaN(days)) {
      errors.push(`Row ${rowNum}: couldn't read a number of days ("${daysRaw}").`);
      continue;
    }
    if (!start || !end) {
      errors.push(`Row ${rowNum}: couldn't read start/end dates ("${startRaw}" / "${endRaw}").`);
      continue;
    }

    const employee = employeeById.get(id);
    const name = String(line[colFor.name] || employee?.fullName || "").trim();
    const sector = String((colFor.sector !== undefined ? line[colFor.sector] : "") || employee?.sector || "").trim();
    const department = String((colFor.department !== undefined ? line[colFor.department] : "") || employee?.department || "").trim();
    const position = String((colFor.position !== undefined ? line[colFor.position] : "") || employee?.position || "").trim();

    if (!employee) {
      errors.push(`Row ${rowNum}: employee ID "${id}" isn't in the roster — add them under Admin → Employees first, or this row will be skipped.`);
      continue;
    }
    if (!name) {
      errors.push(`Row ${rowNum}: missing employee name.`);
      continue;
    }

    // Skip exact duplicates already seen earlier in this same file (same
    // employee, same date range, same day count).
    const dupeKey = `${id}|${start}|${end}|${days}`;
    if (seenKeys.has(dupeKey)) {
      errors.push(`Row ${rowNum}: duplicate of an earlier row in this file for ${name} (${start} to ${end}) — skipped.`);
      continue;
    }
    seenKeys.add(dupeKey);

    const weekStart = startOfReportWeek(start);
    const base = {
      employeeId: id,
      employeeName: name,
      sector,
      department,
      position,
      daysCount: days,
      startDate: start,
      endDate: end,
    };
    rows.push({ ...decorateEntryWithWeek(base, weekStart), weekEndDisplay: endOfReportWeek(weekStart), rowNum });
  }

  return { rows, errors };
}

function toDateISO(value) {
  if (!value) return null;
  if (value instanceof Date) return toISO(value);
  const s = String(value).trim();
  // Try native Date parsing (handles "5/23/2026", "2026-05-23", etc).
  const d = new Date(s);
  if (!Number.isNaN(d.getTime())) return toISO(d);
  return null;
}
