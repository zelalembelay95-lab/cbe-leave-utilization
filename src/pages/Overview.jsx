import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { watchLeaveEntries, watchEmployees } from "../services/db";
import { buildWeeklyReport, buildMonthlyReport, computeAnnualBalance } from "../utils/leaveEngine";
import { startOfReportWeek, currentMonth, currentYear, monthLabel, formatShort, toISO } from "../utils/dateWeek";
import StatCard from "../components/ui/StatCard";
import EmptyState from "../components/ui/EmptyState";
import { useAuth } from "../context/AuthContext";

export default function Overview() {
  const { profile } = useAuth();
  const isAdmin = profile.role === "admin";
  const [employees, setEmployees] = useState([]);
  const [entries, setEntries] = useState([]);
  const year = currentYear();
  const month = currentMonth();
  const weekStart = startOfReportWeek(new Date());

  useEffect(() => watchEmployees(setEmployees), []);
  useEffect(() => watchLeaveEntries(setEntries, { year }), [year]);

  const weekly = useMemo(() => buildWeeklyReport(entries, weekStart), [entries, weekStart]);
  const monthly = useMemo(() => buildMonthlyReport(entries, year, month), [entries, year, month]);

  const today = toISO(new Date());
  const upcoming = useMemo(
    () =>
      entries
        .filter((e) => e.startDate > today)
        .sort((a, b) => a.startDate.localeCompare(b.startDate))
        .slice(0, 8),
    [entries, today]
  );

  const watchlist = useMemo(() => {
    return employees
      .map((emp) => ({ emp, balance: computeAnnualBalance(emp, entries, year) }))
      .filter((r) => r.balance.expiringDecember > 0)
      .sort((a, b) => b.balance.expiringDecember - a.balance.expiringDecember)
      .slice(0, 6);
  }, [employees, entries, year]);

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-semibold text-cbe-ink">
          {isAdmin ? "Admin Overview" : "Leave Overview"}
        </h1>
        <p className="text-cbe-slate text-sm mt-1">
          {monthLabel(year, month)} · Facility Management, NHQ Building Comprehensive Management
        </p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard tone="purple" label="Employees" value={employees.length} sub={isAdmin ? "In the roster" : "Under coverage"} />
        <StatCard tone="white" label="On leave this week" value={`${weekly.totalDays} days`} sub={`${weekly.rows.length} employees`} />
        <StatCard tone="white" label="Month to date" value={`${monthly.totalDays} days`} sub={monthLabel(year, month)} />
        <StatCard tone="gold" label="Expiring in December" value={`${watchlist.reduce((s, r) => s + r.balance.expiringDecember, 0)} days`} sub="Unused balances at risk" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display font-semibold text-lg">Upcoming leave</h2>
            <Link to="/weekly" className="text-xs text-cbe-purple-700 hover:underline">View weekly report →</Link>
          </div>
          {!upcoming.length ? (
            <EmptyState title="Nothing scheduled" body="No approved leave is scheduled to start after today." />
          ) : (
            <div className="card divide-y divide-cbe-purple-50 p-0">
              {upcoming.map((e) => (
                <div key={e.entryId} className="flex items-center justify-between px-5 py-3.5">
                  <div>
                    <p className="text-sm font-medium">{e.employeeName}</p>
                    <p className="text-xs text-cbe-slate">{e.position}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-cbe-purple-800">{e.daysCount} days</p>
                    <p className="text-xs text-cbe-slate">
                      {formatShort(e.startDate)} – {formatShort(e.endDate)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display font-semibold text-lg">December expiry watchlist</h2>
            <Link to="/balances" className="text-xs text-cbe-purple-700 hover:underline">View all balances →</Link>
          </div>
          {!watchlist.length ? (
            <EmptyState title="Nothing at risk" body="No employees currently have unused leave that would expire." />
          ) : (
            <div className="card divide-y divide-cbe-purple-50 p-0">
              {watchlist.map(({ emp, balance }) => (
                <div key={emp.id} className="flex items-center justify-between px-5 py-3.5">
                  <div>
                    <p className="text-sm font-medium">{emp.fullName}</p>
                    <p className="text-xs text-cbe-slate">
                      {balance.takenSinceImport} taken via app · {balance.netAccrual} net accrual
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-red-600">{balance.expiringDecember} days</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {isAdmin && !employees.length && (
        <div className="mt-8">
          <EmptyState
            title="Get started"
            body="Add employees and invite your team leaders to begin collecting weekly leave reports."
            action={
              <Link to="/employees" className="btn-primary">
                Go to Employees →
              </Link>
            }
          />
        </div>
      )}
    </div>
  );
}
