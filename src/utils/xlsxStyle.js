// Styling extracted directly from the uploaded HRBP sample workbook:
//   - Title rows: Tahoma 13, bold, centered
//   - Header rows: Tahoma 11, bold, centered, gold fill (#FFD966 — Excel's
//     "Gold, Accent 4, Lighter 40%", the theme color the original file used)
//   - Data rows: Times New Roman 12, centered (Position column left-aligned),
//     with a light gray fill (#D9D9D9) on the numeric "days" and "total"
//     columns to make them stand out, same as the original.
export const TITLE_FONT = { name: "Tahoma", size: 13, bold: true };
export const HEADER_FONT = { name: "Tahoma", size: 11, bold: true };
export const DATA_FONT = { name: "Times New Roman", size: 12 };

export const GOLD_FILL = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFD966" } };
export const GRAY_FILL = { type: "pattern", pattern: "solid", fgColor: { argb: "FFD9D9D9" } };
export const WHITE_FILL = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFFFFF" } };

export const THIN_BORDER = {
  top: { style: "thin" },
  bottom: { style: "thin" },
  left: { style: "thin" },
  right: { style: "thin" },
};

export const CENTER = { horizontal: "center", vertical: "middle", wrapText: true };
export const LEFT = { horizontal: "left", vertical: "middle", wrapText: true };

export function styleTitleRow(ws, rowNum, lastCol) {
  ws.mergeCells(rowNum, 1, rowNum, lastCol);
  const cell = ws.getCell(rowNum, 1);
  cell.font = TITLE_FONT;
  cell.alignment = CENTER;
}

export function styleHeaderCell(ws, row, col) {
  const cell = ws.getCell(row, col);
  cell.font = HEADER_FONT;
  cell.fill = GOLD_FILL;
  cell.border = THIN_BORDER;
  cell.alignment = CENTER;
}

async function downloadWorkbook(workbook, filename) {
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export { downloadWorkbook };
