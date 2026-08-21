import { useEffect, useRef, useState } from "react";
import { watchEmployees, addLeaveEntry, dedupeLeaveEntries } from "../services/db";
import { parseLeaveExcelFile } from "../utils/importWeeklyExcel";
import { formatShort } from "../utils/dateWeek";
import EmptyState from "../components/ui/EmptyState";

export default function AdminImport() {
  const [employees, setEmployees] = useState([]);
  const [fileName, setFileName] = useState(null);
  const [parsed, setParsed] = useState(null); // { rows, errors }
  const [parsing, setParsing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState(null);
  const [dedupeResult, setDedupeResult] = useState(null);
  const [deduping, setDeduping] = useState(false);
  const fileInput = useRef(null);

  useEffect(() => watchEmployees(setEmployees), []);

  async function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setResult(null);
    setParsing(true);
    try {
      const outcome = await parseLeaveExcelFile(file, employees);
      setParsed(outcome);
    } catch (err) {
      setParsed({ rows: [], errors: [err.message || "Couldn't read that file."] });
    } finally {
      setParsing(false);
    }
  }

  async function handleImport() {
    if (!parsed?.rows.length) return;
    setImporting(true);
    let success = 0;
    let duplicates = 0;
    const failed = [];
    for (const row of parsed.rows) {
      try {
        const res = await addLeaveEntry({ ...row, submittedByName: "Admin import" });
        if (res?.duplicate) duplicates++;
        else success++;
      } catch (err) {
        failed.push(`Row ${row.rowNum} (${row.employeeName}): ${err.message}`);
      }
    }
    setResult({ success, duplicates, failed });
    setImporting(false);
    setParsed(null);
    setFileName(null);
    if (fileInput.current) fileInput.current.value = "";
  }

  function reset() {
    setParsed(null);
    setFileName(null);
    setResult(null);
    if (fileInput.current) fileInput.current.value = "";
  }

  async function handleDedupe() {
    if (!confirm("Scan every leave entry already in the system and remove exact duplicates (same employee, same dates, same days)? This keeps the oldest copy of each.")) return;
    setDeduping(true);
    setDedupeResult(null);
    try {
      const res = await dedupeLeaveEntries();
      setDedupeResult(res);
    } catch (err) {
      setDedupeResult({ error: err.message });
    } finally {
      setDeduping(false);
    }
  }

  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-semibold text-cbe-ink">Import Leave from Excel</h1>
        <p className="text-cbe-slate text-sm mt-1">
          For leave that wasn't submitted through a team leader — upload a spreadsheet and it's added straight
          into the system, appearing in reports and each employee's balance right away.
        </p>
      </div>

      <div className="card space-y-5">
        <div>
          <label className="label">Excel file (.xlsx)</label>
          <input
            ref={fileInput}
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFile}
            className="input file:mr-3 file:rounded-lg file:border-0 file:bg-cbe-purple-100 file:text-cbe-purple-800 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:cursor-pointer"
          />
          <p className="text-xs text-cbe-slate mt-1.5">
            Works with the same layout as the official weekly template — columns for ID, Employee full name,
            Sector/Division, Department/Unit, Position, # of Days, Leave Start Date, and Leave End Date. Column
            order and extra columns don't matter; header text is matched automatically.
          </p>
        </div>

        {parsing && <p className="text-sm text-cbe-slate">Reading file…</p>}

        {parsed && (
          <div className="space-y-4">
            {parsed.errors.length > 0 && (
              <div className="rounded-xl bg-amber-50 border border-amber-200 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-amber-800 mb-2">
                  {parsed.rows.length ? `${parsed.errors.length} row(s) need attention` : "Couldn't import this file"}
                </p>
                <ul className="text-xs text-amber-800 space-y-1 list-disc list-inside">
                  {parsed.errors.map((e, i) => (
                    <li key={i}>{e}</li>
                  ))}
                </ul>
              </div>
            )}

            {parsed.rows.length > 0 && (
              <>
                <p className="text-sm text-cbe-ink font-medium">
                  {parsed.rows.length} entr{parsed.rows.length === 1 ? "y" : "ies"} ready to import from{" "}
                  <span className="font-mono text-xs">{fileName}</span>
                </p>
                <div className="table-shell max-h-80 overflow-y-auto">
                  <table className="report">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Name</th>
                        <th>Days</th>
                        <th>Start</th>
                        <th>End</th>
                        <th>Reporting week</th>
                      </tr>
                    </thead>
                    <tbody>
                      {parsed.rows.map((r, i) => (
                        <tr key={i}>
                          <td className="font-mono text-xs">{r.employeeId}</td>
                          <td className="font-medium">{r.employeeName}</td>
                          <td>{r.daysCount}</td>
                          <td>{formatShort(r.startDate)}</td>
                          <td>{formatShort(r.endDate)}</td>
                          <td className="text-xs text-cbe-slate">
                            {formatShort(r.weekStart)} – {formatShort(r.weekEndDisplay)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="flex gap-3">
                  <button onClick={handleImport} disabled={importing} className="btn-primary">
                    {importing ? "Importing…" : `Import ${parsed.rows.length} entries`}
                  </button>
                  <button onClick={reset} className="btn-ghost">
                    Cancel
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {result && (
          <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4">
            <p className="text-sm text-emerald-800 font-medium">
              Imported {result.success} entr{result.success === 1 ? "y" : "ies"}.
              {result.duplicates > 0 && (
                <span className="block text-amber-700 font-normal mt-1">
                  {result.duplicates} row{result.duplicates === 1 ? "" : "s"} matched leave already in the system
                  for the same employee and dates, so {result.duplicates === 1 ? "it wasn't" : "they weren't"} duplicated.
                </span>
              )}
            </p>
            {result.failed.length > 0 && (
              <ul className="text-xs text-red-700 mt-2 space-y-1 list-disc list-inside">
                {result.failed.map((f, i) => (
                  <li key={i}>{f}</li>
                ))}
              </ul>
            )}
          </div>
        )}

        {!employees.length && (
          <EmptyState
            title="No employees loaded yet"
            body="Add employees under Admin → Employees first, so imported rows can be matched to the right person."
          />
        )}
      </div>

      <div className="card mt-6">
        <h2 className="font-display font-semibold text-lg mb-1">Clean up existing duplicates</h2>
        <p className="text-cbe-slate text-sm mb-4">
          New duplicate leave entries are now blocked automatically — this is only for anything duplicated
          <em> before</em> that check was in place. Scans every leave entry for exact matches (same employee, same
          start/end dates, same number of days) and removes the extras, keeping the oldest submission.
        </p>
        <button onClick={handleDedupe} disabled={deduping} className="btn-primary">
          {deduping ? "Scanning…" : "Find and remove duplicates"}
        </button>
        {dedupeResult && (
          <p className={`text-sm mt-3 ${dedupeResult.error ? "text-red-600" : "text-emerald-700"}`}>
            {dedupeResult.error
              ? dedupeResult.error
              : dedupeResult.removed > 0
                ? `Scanned ${dedupeResult.scanned} entries and removed ${dedupeResult.removed} duplicate${dedupeResult.removed === 1 ? "" : "s"}.`
                : `Scanned ${dedupeResult.scanned} entries — no duplicates found.`}
          </p>
        )}
      </div>
    </div>
  );
}
