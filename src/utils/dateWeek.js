// Reporting weeks run Friday -> Thursday, matching HRBP's official weekly
// leave utilization report ("Employees on Leave during the Week dated
// Friday <date> to <date>" ... "The Report Shall be sent Every Friday to
// the HRBP Department").

export function toISO(date) {
  // IMPORTANT: build the "YYYY-MM-DD" string from LOCAL date parts, not
  // toISOString() (which converts to UTC). Ethiopia is UTC+3, so a UTC
  // conversion silently rolls local midnight back to the previous day —
  // that bug used to make entries land in the wrong reporting week (they'd
  // still show up in the right month, just not the right week).
  const d = date instanceof Date ? date : new Date(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function parseISO(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

// Given any date, return the Friday that starts its reporting week (as an
// ISO date string). If the date itself is a Friday, it returns that date.
export function startOfReportWeek(dateLike) {
  const d = dateLike instanceof Date ? new Date(dateLike) : parseISO(dateLike);
  const day = d.getDay(); // 0 = Sun ... 5 = Fri ... 6 = Sat
  const diff = (day - 5 + 7) % 7; // days since the most recent Friday
  d.setDate(d.getDate() - diff);
  d.setHours(0, 0, 0, 0);
  return toISO(d);
}

// Thursday that ends the reporting week started by `fridayIso`.
export function endOfReportWeek(fridayIso) {
  const d = parseISO(fridayIso);
  d.setDate(d.getDate() + 6);
  return toISO(d);
}

export function formatLong(iso) {
  if (!iso) return "";
  const d = parseISO(iso);
  return d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
}

export function formatShort(iso) {
  if (!iso) return "";
  const d = parseISO(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

// "Month Day, Year" with no weekday — matches the sample report's end date.
export function formatMonthDayYear(iso) {
  if (!iso) return "";
  const d = parseISO(iso);
  return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

export function monthLabel(year, month) {
  return new Date(year, month - 1, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

// Build the list of Friday-start reporting weeks that fall (fully or
// partly) inside a given calendar month.
export function weeksInMonth(year, month) {
  const first = new Date(year, month - 1, 1);
  const last = new Date(year, month, 0);
  const weeks = [];
  let cursor = parseISO(startOfReportWeek(first));
  while (cursor <= last) {
    const friday = toISO(cursor);
    weeks.push({ start: friday, end: endOfReportWeek(friday) });
    cursor.setDate(cursor.getDate() + 7);
  }
  return weeks;
}

export function currentYear() {
  return new Date().getFullYear();
}

export function currentMonth() {
  return new Date().getMonth() + 1;
}
