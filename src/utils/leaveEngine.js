import { mondayOf, saturdayOf } from "./dateWeek";

/**
 * Build the weekly report exactly in the shape of the uploaded Excel
 * ("S.N | ID | Employee full name | Sector/Division | Department/Unit |
 * Position | #Days | Start | End | Total").
 *
 * @param {Array} entries - leave entries (already filtered to the org/team the caller may see)
 * @param {string} weekStart - Monday ISO date
 * @returns {{ weekStart, weekEnd, rows, totalDays }}
 */
export function buildWeeklyReport(entries, weekStart) {
  const weekEnd = saturdayOf(weekStart);
  const rows = entries
    .filter((e) => e.weekStart === weekStart)
    .sort((a, b) => a.employeeName.localeCompare(b.employeeName))
    .map((e, idx) => ({
      sn: idx + 1,
      id: e.employeeId,
      name: e.employeeName,
      sector: e.sector,
      department: e.department,
      position: e.position,
      days: e.daysCount,
      start: e.startDate,
      end: e.endDate,
      total: e.daysCount,
      submittedBy: e.submittedByName,
    }));
  const totalDays = round2(rows.reduce((s, r) => s + Number(r.total || 0), 0));
  return { weekStart, weekEnd, rows, totalDays };
}

/**
 * Aggregate every entry that belongs to a given calendar month (grouped by
 * the Monday of the reporting week the entry was submitted under, matching
 * how team leaders already split multi-week leave in the source workbook).
 */
export function buildMonthlyReport(entries, year, month) {
  const monthEntries = entries.filter((e) => e.year === year && e.month === month);
  const byEmployee = new Map();
  for (const e of monthEntries) {
    const key = e.employeeId;
    if (!byEmployee.has(key)) {
      byEmployee.set(key, {
        id: e.employeeId,
        name: e.employeeName,
        sector: e.sector,
        department: e.department,
        position: e.position,
        totalDays: 0,
        entryCount: 0,
      });
    }
    const rec = byEmployee.get(key);
    rec.totalDays = round2(rec.totalDays + Number(e.daysCount || 0));
    rec.entryCount += 1;
  }
  const rows = Array.from(byEmployee.values()).sort((a, b) => a.name.localeCompare(b.name));
  const totalDays = round2(rows.reduce((s, r) => s + r.totalDays, 0));
  return { year, month, rows, totalDays, employeesOnLeave: rows.length };
}

/**
 * Compute an employee's annual leave balance and December expiry, per HR's
 * rule that approved annual leave must be used within the calendar year.
 *
 * @param {Object} employee - { annualEntitlement }
 * @param {Array} entries - all of this employee's leave entries for `year`
 * @param {number} year
 * @param {Date} [asOf] - defaults to now; lets you preview any point in time
 */
export function computeAnnualBalance(employee, entries, year, asOf = new Date()) {
  const entitlement = Number(employee.annualEntitlement || 0);
  const takenYTD = round2(
    entries
      .filter((e) => e.year === year && e.employeeId === employee.id)
      .reduce((s, e) => s + Number(e.daysCount || 0), 0)
  );
  const remaining = round2(Math.max(entitlement - takenYTD, 0));

  const isPastYear = asOf.getFullYear() > year;
  const isCurrentYear = asOf.getFullYear() === year;
  const yearHasEnded = isPastYear || (isCurrentYear && asOf.getMonth() === 11 && asOf.getDate() >= 31);

  // Days that will be lost (no carry-over) if not used by Dec 31.
  // Before the year ends this is a live forecast; once the year has ended
  // it is the actual amount that expired.
  const expiringDecember = remaining; // policy: 100% of unused entitlement expires, no carry-over
  const netBalance = yearHasEnded ? 0 : remaining;

  return {
    year,
    entitlement,
    takenYTD,
    remaining,
    expiringDecember: round2(expiringDecember),
    netBalance: round2(netBalance),
    status: yearHasEnded ? "expired" : "active",
  };
}

export function round2(n) {
  return Math.round((Number(n) + Number.EPSILON) * 100) / 100;
}

// Derive weekStart/weekEnd/month/year metadata for a leave entry given the
// reporting week's Monday date (used at submission time).
export function decorateEntryWithWeek(entry, weekStartISO) {
  const monday = mondayOf(weekStartISO);
  const d = new Date(monday);
  return {
    ...entry,
    weekStart: monday,
    weekEnd: saturdayOf(monday),
    month: d.getMonth() + 1,
    year: d.getFullYear(),
  };
}
