import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { watchLeaveEntries, watchEmployees } from "../services/db";
import { computeAnnualBalance } from "../utils/leaveEngine";
import { currentYear, formatShort } from "../utils/dateWeek";
import StatCard from "../components/ui/StatCard";
import EmptyState from "../components/ui/EmptyState";

export default function EmployeeSelf() {
  const { profile } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [entries, setEntries] = useState([]);
  const [year, setYear] = useState(currentYear());

  useEffect(() => watchEmployees(setEmployees), []);
  useEffect(() => watchLeaveEntries(setEntries, { year }), [year]);

  const employee = useMemo(
    () => employees.find((e) => e.id === profile.employeeId),
    [employees, profile.employeeId]
  );

  const myEntries = useMemo(
    () => entries.filter((e) => e.employeeId === profile.employeeId).sort((a, b) => b.startDate.localeCompare(a.startDate)),
    [entries, profile.employeeId]
  );

  const balance = useMemo(
    () => (employee ? computeAnnualBalance(employee, entries, year) : null),
    [employee, entries, year]
  );

  if (!profile.employeeId || !employee) {
    return (
      <EmptyState
        title="Your account isn't linked to an employee record yet"
        body="Ask an administrator to link your account to your employee ID from Admin → Users."
      />
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display text-2xl font-semibold text-cbe-ink">My Leave</h1>
          <p className="text-cbe-slate text-sm mt-1">
            {employee.fullName} · {employee.position} · ID {employee.id}
          </p>
        </div>
        <div>
          <label className="label">Year</label>
          <input type="number" className="input w-28" value={year} onChange={(e) => setYear(Number(e.target.value))} />
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard tone="purple" label="Net accrual (HR)" value={`${balance.netAccrual} days`} />
        <StatCard tone="white" label="Taken via app this year" value={`${balance.takenSinceImport} days`} />
        <StatCard tone="white" label="Remaining balance" value={`${balance.netRemaining} days`} />
        <StatCard
          tone="gold"
          label={balance.status === "expired" ? "Expired in December" : "At risk of expiring"}
          value={`${balance.expiringDecember} days`}
          sub="No carry-over past Dec 31"
        />
      </div>

      <h2 className="font-display font-semibold text-lg mb-3">Leave history — {year}</h2>
      {!myEntries.length ? (
        <EmptyState title="No leave recorded yet" body="Approved leave your team leader submits will show up here." />
      ) : (
        <div className="table-shell">
          <table className="report">
            <thead>
              <tr>
                <th>Start date</th>
                <th>End date</th>
                <th>Days</th>
                <th>Reporting week</th>
                <th>Submitted by</th>
              </tr>
            </thead>
            <tbody>
              {myEntries.map((e) => (
                <tr key={e.entryId}>
                  <td>{formatShort(e.startDate)}</td>
                  <td>{formatShort(e.endDate)}</td>
                  <td className="font-semibold">{e.daysCount}</td>
                  <td>
                    {formatShort(e.weekStart)} – {formatShort(e.weekEnd)}
                  </td>
                  <td className="text-cbe-slate text-xs">{e.submittedByName}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
