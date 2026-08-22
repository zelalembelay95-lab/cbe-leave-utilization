import { useMemo } from "react";
import { formatShort } from "../../utils/dateWeek";
import { computeRuns } from "../../utils/reportRuns";
import EmptyState from "../ui/EmptyState";

export default function LeaveReportTable({ rows, totalDays, emptyTitle, emptyBody }) {
  const idRuns = useMemo(() => computeRuns(rows, (r) => r.id), [rows]);
  const sectorRuns = useMemo(() => computeRuns(rows, (r) => r.sector), [rows]);
  const departmentRuns = useMemo(() => computeRuns(rows, (r) => r.department), [rows]);

  if (!rows.length) {
    return <EmptyState title={emptyTitle} body={emptyBody} />;
  }

  return (
    <>
      <div className="table-shell">
        <table className="report">
          <thead>
            <tr>
              <th>S.N</th>
              <th>ID</th>
              <th>Employee full name</th>
              <th>Sector/Division</th>
              <th>Department/Unit</th>
              <th>Position</th>
              <th># Days</th>
              <th>Start date</th>
              <th>End date</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={`${r.id}-${i}`}>
                {idRuns[i] > 0 && (
                  <>
                    <td rowSpan={idRuns[i]}>{r.sn}</td>
                    <td rowSpan={idRuns[i]} className="font-mono text-xs">{r.id}</td>
                    <td rowSpan={idRuns[i]} className="font-medium">{r.name}</td>
                  </>
                )}
                {sectorRuns[i] > 0 && <td rowSpan={sectorRuns[i]}>{r.sector}</td>}
                {departmentRuns[i] > 0 && <td rowSpan={departmentRuns[i]}>{r.department}</td>}
                {idRuns[i] > 0 && <td rowSpan={idRuns[i]}>{r.position}</td>}
                <td>{r.days}</td>
                <td>{formatShort(r.start)}</td>
                <td>{formatShort(r.end)}</td>
                {idRuns[i] > 0 && <td rowSpan={idRuns[i]} className="font-semibold">{r.total}</td>}
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={9} className="text-right font-semibold">Total leave days</td>
              <td className="font-display font-semibold text-cbe-purple-800">{totalDays}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="mt-6 text-sm text-cbe-ink">
        Supervisor Name and Position: ____________________________
      </div>

      <div className="text-xs text-cbe-slate mt-4 space-y-1">
        <p>Note: Employees who have returned from leave and are on work in the reporting period shall be excluded from the report.</p>
        <p>Whereas, employees whose leave extended beyond the period and are still on leave shall be included and remain in the report.</p>
        <p className="font-medium text-cbe-purple-800">The report shall be sent every Friday to the HRBP Department.</p>
      </div>
    </>
  );
}
