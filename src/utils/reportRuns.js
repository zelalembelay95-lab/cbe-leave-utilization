// Given a list of rows and a way to read one column's value from a row,
// returns a parallel array where:
//   - a positive number at index i means row i starts a merged block that
//     is that many rows tall (because the next N-1 rows have the same
//     value in this column)
//   - 0 at index i means this row's value is already covered by an earlier
//     row's merge — don't render/write anything for it
//
// This is column-independent: Sector/Department might merge across many
// employees at once (since the whole org shares one value), while
// ID/Name/Position only merge across one employee's own multiple leave
// periods. Call this separately per column with the right key function.
export function computeRuns(rows, keyFn) {
  const runStart = new Array(rows.length).fill(0);
  let i = 0;
  while (i < rows.length) {
    const val = keyFn(rows[i]);
    let j = i + 1;
    while (j < rows.length && keyFn(rows[j]) === val) j++;
    runStart[i] = j - i;
    for (let k = i + 1; k < j; k++) runStart[k] = 0;
    i = j;
  }
  return runStart;
}
