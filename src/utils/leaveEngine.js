import { startOfReportWeek, endOfReportWeek } from "./dateWeek";

/**
 * Build the weekly report exactly in the shape of the uploaded Excel
 * ("S.N | ID | Employee full name | Sector/Division | Department/Unit |
 * Position | #Days | Start | End | Total").
 *
 * If the same employee (matched by ID) has more than one leave entry in
 * this reporting week — e.g. two separate periods submitted separately, or
 * a duplicate that slipped through — they're grouped into a single block:
 * ID/Name/Sector/Department/Position are shown once (merged, in both the
 * on-screen table and the Excel export) and the Total column is the sum of
 * all their days that week.
 *
 * @param {Array} entries - leave entries (already filtered to the org/team the caller may see)
 * @param {string} weekStart - Monday ISO date (start of the reporting week)
 * @returns {{ weekStart, weekEnd, rows, totalDays }}
 */
export function buildWeeklyReport(entries, weekStart) {
  const weekEnd = endOfReportWeek(weekStart);
  const weekEntries = entries.filter((e) => e.weekStart === weekStart);

  const groups = new Map();
  for (const e of weekEntries) {
    const key = e.employeeId;
    if (!groups.has(key)) {
      groups.set(key, {
        id: e.employeeId,
        name: e.employeeName,
        sector: e.sector,
        department: e.department,
        position: e.position,
        periods: [],
      });
    }
    groups.get(key).periods.push({ start: e.startDate, end: e.endDate, days: Number(e.daysCount || 0) });
  }

  const groupList = Array.from(groups.values())
    .map((g) => ({
      ...g,
      periods: g.periods.sort((a, b) => a.start.localeCompare(b.start)),
      total: round2(g.periods.reduce((s, p) => s + p.days, 0)),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  const rows = [];
  groupList.forEach((g, gIdx) => {
    g.periods.forEach((p, pIdx) => {
      rows.push({
        sn: gIdx + 1,
        id: g.id,
        name: g.name,
        sector: g.sector,
        department: g.department,
        position: g.position,
        days: p.days,
        start: p.start,
        end: p.end,
        total: g.total,
        isFirstOfGroup: pIdx === 0,
        groupSize: g.periods.length,
      });
    });
  });

  const totalDays = round2(groupList.reduce((s, g) => s + g.total, 0));
  return { weekStart, weekEnd, rows, totalDays };
}

/**
 * Aggregate every entry that belongs to a given calendar month (grouped by
 * the Monday that starts the reporting week the entry was submitted under, matching
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
 * Compute an employee's leave balance from HR's authoritative export plus
 * anything submitted through this app since that export.
 *
 * HR supplies two numbers per employee (see src/data/seedEmployees.js):
 *   - netAccrualTillNow  — total unused leave accrued as of the export date.
 *   - leaveExpiringDec31 — the part of that balance that is LOST if unused
 *     by December 31 (no carry-over). The remainder of netAccrualTillNow
 *     (netAccrualTillNow − leaveExpiringDec31) is safe and carries forward
 *     regardless of December.
 *
 * Any leave submitted via the app for `year` is treated as taken *after*
 * that HR export, and is applied against the expiring bucket first (since
 * it's the leave most at risk of being lost), then against the rest of the
 * balance.
 *
 * @param {Object} employee - { id, netAccrualTillNow, leaveExpiringDec31 }
 * @param {Array} entries - this employee's leave entries submitted via the app
 * @param {number} year
 * @param {Date} [asOf] - defaults to now; lets you preview any point in time
 */
export function computeAnnualBalance(employee, entries, year, asOf = new Date()) {
  const hrNetAccrual = round2(Number(employee.netAccrualTillNow || 0));
  const hrExpiring = round2(Number(employee.leaveExpiringDec31 || 0));

  const takenSinceImport = round2(
    entries
      .filter((e) => e.year === year && e.employeeId === employee.id)
      .reduce((s, e) => s + Number(e.daysCount || 0), 0)
  );

  const usedAgainstExpiring = Math.min(takenSinceImport, hrExpiring);
  const expiringRemaining = round2(Math.max(hrExpiring - usedAgainstExpiring, 0));
  const netRemaining = round2(Math.max(hrNetAccrual - takenSinceImport, 0));

  const isPastYear = asOf.getFullYear() > year;
  const isCurrentYear = asOf.getFullYear() === year;
  const yearHasEnded = isPastYear || (isCurrentYear && asOf.getMonth() === 11 && asOf.getDate() >= 31);

  // Once the year ends, only the *expiring* bucket is actually lost — the
  // rest of the balance (this year's fresh, non-expiring accrual) survives.
  const netAfterExpiry = round2(Math.max(netRemaining - expiringRemaining, 0));

  return {
    year,
    netAccrual: hrNetAccrual,
    takenSinceImport,
    netRemaining,
    expiringDecember: expiringRemaining,
    netBalance: yearHasEnded ? netAfterExpiry : netRemaining,
    status: yearHasEnded ? "expired" : "active",
  };
}

export function round2(n) {
  return Math.round((Number(n) + Number.EPSILON) * 100) / 100;
}

// Derive weekStart/weekEnd/month/year metadata for a leave entry given the
// reporting week's Monday date (used at submission time).
export function decorateEntryWithWeek(entry, weekStartISO) {
  const monday = startOfReportWeek(weekStartISO);
  const d = new Date(monday);
  return {
    ...entry,
    weekStart: monday,
    weekEnd: endOfReportWeek(monday),
    month: d.getMonth() + 1,
    year: d.getFullYear(),
  };
}
