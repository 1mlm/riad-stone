import type { Workbook, Worksheet } from "exceljs";
import type { LengthUnit } from "@/utils/length";
import { cellDate, cellNumber, cellText } from "./cell";
import {
  type ImportField,
  identifyField,
  REQUIRED_HEADER_FIELDS,
} from "./fieldMatchers";
import { looksLikeFooterRow } from "./footerKeywords";
import { lengthUnitFromHeader } from "./lengthUnitFromHeader";
import { normalizeHeader } from "./normalize";
import type {
  HeaderCandidate,
  ParsedEntreeRow,
  ParsedTable,
  ParseResult,
} from "./types";
import { toWholeCm } from "./units";

// row-level fields worth pulling from a metadata block sitting above a table
// (e.g. "Date" / "Contenir" on their own line before the line-item table
// starts) rather than as one of the table's own columns
const METADATA_FIELDS: ImportField[] = [
  "date",
  "conteneur",
  "origine",
  "commentaire",
];

// labels worth pulling from that same metadata block even though they don't
// map to any entrée column of their own (see the sample file's "Client" /
// "Fournisseur" lines) — folded into the commentaire instead of dropped
const EXTRA_METADATA_LABELS = [
  { label: "client", heading: "Client" },
  { label: "fournisseur", heading: "Fournisseur" },
] as const;
type ExtraMetadataLabel = (typeof EXTRA_METADATA_LABELS)[number]["label"];

// below this, a longueur/largeur value can only sensibly be metres — no real
// tile or slab is a few centimetres long. Above it, only cm makes sense: a
// slab isn't tens of metres long either. Inferred per table (not per file),
// since one workbook can list tiles in cm and slabs in metres on different
// sheets — verified against the sample: 60/30 (cm) and 2.6/1.25 (m)
const METERS_MAGNITUDE_CEILING = 10;

// how far above a header row to look for a metadata block before giving up
// — a safety cap, not a real limit on real files
const MAX_METADATA_LOOKBACK = 15;

function rowCellTexts(sheet: Worksheet, rowNumber: number, maxCol: number) {
  const row = sheet.getRow(rowNumber);
  const texts: string[] = [];
  for (let col = 1; col <= maxCol; col++)
    texts.push(cellText(row.getCell(col)));
  return texts;
}

function isBlankRow(texts: string[]) {
  return texts.every((text) => text === "");
}

// which column holds which field, for the table whose header sits at
// `headerRow` — a column with no recognizable header is simply left out, so
// e.g. "Total m2" (a computed column the app doesn't take as input) is read
// as ordinary text but never mapped anywhere. "N° Block"/"Bloc" does map,
// to reference — it's the per-lot id in these files, not just a column name
// that looks like one
function mapHeaderColumns(sheet: Worksheet, headerRow: number, maxCol: number) {
  const row = sheet.getRow(headerRow);
  const columns = new Map<number, ImportField>();
  for (let col = 1; col <= maxCol; col++) {
    const field = identifyField(cellText(row.getCell(col)));
    if (field && !columns.has(col) && ![...columns.values()].includes(field))
      columns.set(col, field);
  }
  return columns;
}

function scoreHeaderRow(texts: string[]) {
  const matched = new Set(
    texts
      .map((text) => identifyField(text))
      .filter((field) => field !== undefined),
  );
  return REQUIRED_HEADER_FIELDS.filter((field) => matched.has(field)).length;
}

// scans upward from just above a table's header for a label/value metadata
// block ("Date" in one cell, the date in the next non-empty cell after it),
// stopping at the previous table's footer or the top of the sheet — the gap
// of blank rows in between (see the sample file) doesn't stop the scan, only
// a footer row or running out of room does
function readMetadataDefaults(
  sheet: Worksheet,
  headerRow: number,
  maxCol: number,
): {
  fields: Partial<Record<ImportField, string>>;
  extra: Partial<Record<ExtraMetadataLabel, string>>;
} {
  const fields: Partial<Record<ImportField, string>> = {};
  const extra: Partial<Record<ExtraMetadataLabel, string>> = {};
  const lowest = Math.max(1, headerRow - MAX_METADATA_LOOKBACK);
  for (let rowNumber = headerRow - 1; rowNumber >= lowest; rowNumber--) {
    const texts = rowCellTexts(sheet, rowNumber, maxCol);
    if (looksLikeFooterRow(texts)) break;
    const firstNonEmptyIndex = texts.findIndex((text) => text !== "");
    if (firstNonEmptyIndex === -1) continue;
    const valueIndex = texts.findIndex(
      (text, index) => index > firstNonEmptyIndex && text !== "",
    );
    if (valueIndex === -1) continue;

    const field = identifyField(texts[firstNonEmptyIndex]);
    if (field && METADATA_FIELDS.includes(field) && !(field in fields)) {
      // the date label's value cell needs cellDate's parsing (a real Excel
      // date, or dd/mm/yyyy text) — every other metadata field is read as
      // plain text already, straight off `texts`
      const parsed =
        field === "date"
          ? cellDate(sheet.getRow(rowNumber).getCell(valueIndex + 1))
          : texts[valueIndex];
      if (parsed) fields[field] = parsed;
      continue;
    }

    const normalizedLabel = normalizeHeader(texts[firstNonEmptyIndex]);
    const extraLabel = EXTRA_METADATA_LABELS.find(
      (entry) => entry.label === normalizedLabel,
    )?.label;
    if (extraLabel && !(extraLabel in extra))
      extra[extraLabel] = texts[valueIndex];
  }
  return { fields, extra };
}

// Client/Fournisseur have nowhere else to go, so they ride along in the
// commentaire — a placeholder-redacted sample ("*****") still comes through
// honestly as "Client: *****", which is exactly what the cell said
function buildMetadataNote(
  extra: Partial<Record<ExtraMetadataLabel, string>>,
): string | null {
  const parts = EXTRA_METADATA_LABELS.map(({ label, heading }) =>
    extra[label] ? `${heading}: ${extra[label]}` : null,
  ).filter((part) => part !== null);
  return parts.length > 0 ? parts.join(" · ") : null;
}

let nextRowId = 0;

function parseTable(
  sheet: Worksheet,
  headerRow: number,
  tableIndex: number,
  maxCol: number,
): { table: ParsedTable; nextRow: number } {
  const columns = mapHeaderColumns(sheet, headerRow, maxCol);
  const { fields: metadataDefaults, extra: metadataExtra } =
    readMetadataDefaults(sheet, headerRow, maxCol);
  const metadataNote = buildMetadataNote(metadataExtra);
  const columnEntries = [...columns.entries()];
  const getColumn = (field: ImportField) =>
    columnEntries.find(([, mapped]) => mapped === field)?.[0];

  const referenceCol = getColumn("reference");
  const designationCol = getColumn("designation");
  const longueurCol = getColumn("longueur");
  const largeurCol = getColumn("largeur");
  const piecesCol = getColumn("nombrePieces");
  const dateCol = getColumn("date");
  const origineCol = getColumn("origine");
  const conteneurCol = getColumn("conteneur");
  const commentaireCol = getColumn("commentaire");

  const rawRows: {
    row: number;
    designation: string | null;
    reference: string | null;
    longueurValue: number | null;
    largeurValue: number | null;
    nombrePieces: number | null;
    date: string;
    origine: string | null;
    conteneur: string | null;
    commentaire: string | null;
  }[] = [];

  let rowNumber = headerRow + 1;
  for (; rowNumber <= sheet.rowCount + 1; rowNumber++) {
    const texts = rowCellTexts(sheet, rowNumber, maxCol);
    if (isBlankRow(texts) || looksLikeFooterRow(texts)) break;

    const row = sheet.getRow(rowNumber);
    const textOf = (col: number | undefined) =>
      col === undefined ? "" : cellText(row.getCell(col));
    const nonEmpty = (value: string) => (value === "" ? null : value);

    rawRows.push({
      row: rowNumber,
      designation: nonEmpty(textOf(designationCol)),
      reference: nonEmpty(textOf(referenceCol)),
      longueurValue: longueurCol ? cellNumber(row.getCell(longueurCol)) : null,
      largeurValue: largeurCol ? cellNumber(row.getCell(largeurCol)) : null,
      nombrePieces: piecesCol ? cellNumber(row.getCell(piecesCol)) : null,
      date:
        (dateCol ? cellDate(row.getCell(dateCol)) : null) ??
        metadataDefaults.date ??
        new Date().toISOString().slice(0, 10),
      origine: nonEmpty(textOf(origineCol)) ?? metadataDefaults.origine ?? null,
      conteneur:
        nonEmpty(textOf(conteneurCol)) ?? metadataDefaults.conteneur ?? null,
      commentaire:
        [
          nonEmpty(textOf(commentaireCol)) ?? metadataDefaults.commentaire,
          metadataNote,
        ]
          .filter((part) => part !== null && part !== undefined)
          .join(" — ") || null,
    });
  }

  // a column named e.g. "Longueur (cm)" says its own unit outright, which
  // beats guessing — that only kicks in once per table (not per row), for
  // whichever of longueur/largeur didn't name theirs explicitly. One
  // workbook can list tiles in cm on one sheet and slabs in metres on
  // another (or even another table on the same sheet), which is why this is
  // never inferred file-wide
  const headerRowRef = sheet.getRow(headerRow);
  const explicitLongueurUnit = longueurCol
    ? lengthUnitFromHeader(cellText(headerRowRef.getCell(longueurCol)))
    : undefined;
  const explicitLargeurUnit = largeurCol
    ? lengthUnitFromHeader(cellText(headerRowRef.getCell(largeurCol)))
    : undefined;

  const magnitudes = rawRows.flatMap((row) =>
    [row.longueurValue, row.largeurValue].filter(
      (value): value is number => value !== null,
    ),
  );
  const inferredUnit: LengthUnit =
    magnitudes.length > 0 && Math.max(...magnitudes) < METERS_MAGNITUDE_CEILING
      ? "m"
      : "cm";

  const longueurUnit = explicitLongueurUnit ?? inferredUnit;
  const largeurUnit = explicitLargeurUnit ?? inferredUnit;

  const rows: ParsedEntreeRow[] = rawRows.map((raw) => ({
    id: String(nextRowId++),
    designation: raw.designation,
    reference: raw.reference,
    longueurValue: toWholeCm(raw.longueurValue, longueurUnit),
    longueurRawValue: raw.longueurValue,
    longueurUnit: "cm",
    largeurValue: toWholeCm(raw.largeurValue, largeurUnit),
    largeurRawValue: raw.largeurValue,
    largeurUnit: "cm",
    nombrePieces: raw.nombrePieces,
    date: raw.date,
    origine: raw.origine,
    conteneur: raw.conteneur,
    commentaire: raw.commentaire,
    source: { sheet: sheet.name, tableIndex, row: raw.row },
  }));

  return {
    table: {
      sheet: sheet.name,
      tableIndex,
      headerRow,
      rows,
      longueurUnit,
      largeurUnit,
    },
    nextRow: rowNumber,
  };
}

function parseSheet(
  sheet: Worksheet,
  startTableIndex: number,
): { tables: ParsedTable[]; headerCandidates: HeaderCandidate[] } {
  const maxCol = sheet.columnCount || 0;
  const tables: ParsedTable[] = [];
  const headerCandidates: HeaderCandidate[] = [];
  let tableIndex = startTableIndex;

  let rowNumber = 1;
  while (rowNumber <= sheet.rowCount) {
    const texts = rowCellTexts(sheet, rowNumber, maxCol);
    if (isBlankRow(texts)) {
      rowNumber++;
      continue;
    }

    // a full header match wins even over a footer-looking row: a column
    // genuinely named "Total m2" makes its own header row contain the word
    // "total", the same word a real footer/summary row uses — score the row
    // as a header first, and only fall back to treating it as a footer
    // (nothing here, keep scanning) once it's clear it isn't one
    const score = scoreHeaderRow(texts);
    if (score === REQUIRED_HEADER_FIELDS.length) {
      const { table, nextRow } = parseTable(
        sheet,
        rowNumber,
        tableIndex,
        maxCol,
      );
      tables.push(table);
      tableIndex++;
      rowNumber = nextRow;
      continue;
    }

    if (looksLikeFooterRow(texts)) {
      rowNumber++;
      continue;
    }

    if (score > 0)
      headerCandidates.push({
        sheet: sheet.name,
        row: rowNumber,
        headers: texts.filter((text) => text !== ""),
      });
    rowNumber++;
  }

  return { tables, headerCandidates };
}

export function parseWorkbook(workbook: Workbook): ParseResult {
  const tables: ParsedTable[] = [];
  const headerCandidates: HeaderCandidate[] = [];
  for (const sheet of workbook.worksheets) {
    const result = parseSheet(sheet, tables.length);
    tables.push(...result.tables);
    headerCandidates.push(...result.headerCandidates);
  }
  return { tables, headerCandidates };
}
