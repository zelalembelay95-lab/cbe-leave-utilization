// Reporting weeks run Monday -> Saturday, mirroring the wording used on the
// "Weekly Leave Utilization Submission" Google Form ("Monday ... - Saturday ...").

export function toISO(date) {
  const d = date instanceof Date ? date : new Date(date);
  return d.toISOString().slice(0, 10);
}

export function parseISO(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

// Given any date, return the Monday of that week (as an ISO date string).
export function mondayOf(dateLike) {
  const d = dateLike instanceof Date ? new Date(dateLike) : parseISO(dateLike);
  const day = d.getDay(); // 0 = Sun ... 6 = Sat
  const diff = day === 0 ? -6 : 1 - day; // shift back to Monday
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return toISO(d);
}

export function saturdayOf(mondayIso) {
  const d = parseISO(mondayIso);
  d.setDate(d.getDate() + 5);
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

export function monthLabel(year, month) {
  return new Date(year, month - 1, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

// Build the list of Monday-start weeks that fall (fully or partly) inside a
// given calendar month, used to populate the "reporting week" dropdown.
export function weeksInMonth(year, month) {
  const first = new Date(year, month - 1, 1);
  const last = new Date(year, month, 0);
  const weeks = [];
  let cursor = parseISO(mondayOf(first));
  while (cursor <= last) {
    const monday = toISO(cursor);
    weeks.push({ start: monday, end: saturdayOf(monday) });
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
