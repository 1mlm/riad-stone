import type { Cell, CellRichTextValue, CellValue } from "exceljs";

// a merged cell read through worksheet.getCell() already resolves to the
// master cell's value — verified against the sample file (B15 inside a
// B14:B29 merge returns "Carreaux Silvia 60*30", the master's text), so no
// manual merge-range bookkeeping is needed here
function resolveValue(value: CellValue): CellValue {
  if (value && typeof value === "object" && "result" in value)
    return resolveValue(value.result ?? null);
  return value;
}

function isRichText(value: CellValue): value is CellRichTextValue {
  return Boolean(value && typeof value === "object" && "richText" in value);
}

// the plain text a cell displays, whatever shape it's stored as (a literal
// string, a formula's computed result, rich text runs, a date, ...) — never
// throws on an unreadable cell (an error formula, e.g.), just reads as empty
export function cellText(cell: Cell): string {
  const value = resolveValue(cell.value);
  if (value === null || value === undefined) return "";
  if (isRichText(value)) return value.richText.map((run) => run.text).join("");
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "object") return "";
  return String(value).trim();
}

export function cellNumber(cell: Cell): number | null {
  const value = resolveValue(cell.value);
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "string") {
    // handles a French "1 234,56" as readily as a plain "1234.56"
    const normalized = value.trim().replace(/\s/g, "").replace(",", ".");
    const parsed = Number(normalized);
    return normalized && Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

const DD_MM_YYYY = /^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/;

// an isoDate string (yyyy-mm-dd), or null if the cell has nothing readable
// as a date — a plain cell.value Date (Excel's own date cells decode to one
// automatically) and a dd/mm/yyyy French text date are both accepted, since
// a spreadsheet not authored by this app has no reason to use ISO order
export function cellDate(cell: Cell): string | null {
  const value = resolveValue(cell.value);
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  const text = cellText(cell).trim();
  const match = text.match(DD_MM_YYYY);
  if (!match) return null;
  const [, day, month, year] = match;
  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
}
