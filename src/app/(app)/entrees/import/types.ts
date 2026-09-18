import type { LengthUnit } from "@/utils/length";

// one row as read off the sheet, before validation — every field stays
// whatever the sheet actually had, including null/empty for a required
// field, so the preview can show exactly what's missing rather than a row
// silently dropped
export type ParsedEntreeRow = {
  id: string;
  designation: string | null;
  reference: string | null;
  // always stored as a whole number of cm, same unit the manual form uses —
  // see units.ts. longueurRawValue/largeurRawValue keep the untouched number
  // straight off the sheet, in whatever unit the table was read in, so a
  // later "actually this whole column is mm" correction can recompute
  // straight from the source instead of re-rounding an already-rounded cm
  // figure
  longueurValue: number | null;
  longueurRawValue: number | null;
  longueurUnit: LengthUnit;
  largeurValue: number | null;
  largeurRawValue: number | null;
  largeurUnit: LengthUnit;
  nombrePieces: number | null;
  // always resolved to an ISO date — a row with nothing to read defaults to
  // the day of import, same as the manual add form leaving the date empty
  date: string;
  origine: string | null;
  conteneur: string | null;
  commentaire: string | null;
  source: { sheet: string; tableIndex: number; row: number };
};

export type ParsedTable = {
  sheet: string;
  tableIndex: number;
  headerRow: number;
  rows: ParsedEntreeRow[];
  // the unit each row's longueurValue/largeurValue was originally read in —
  // the starting point for this table's unit-correction controls, which
  // recompute every row in the table at once rather than one cell at a time
  longueurUnit: LengthUnit;
  largeurUnit: LengthUnit;
};

// a row that scored close to a header but didn't clear the bar — surfaced so
// an unreadable file says why instead of just showing nothing
export type HeaderCandidate = {
  sheet: string;
  row: number;
  headers: string[];
};

export type ParseResult = {
  tables: ParsedTable[];
  headerCandidates: HeaderCandidate[];
};
