import type { LengthUnit } from "@/utils/length";

// one row as read off the sheet, before validation — every field stays
// whatever the sheet actually had, including null/empty for a required
// field, so the preview can show exactly what's missing rather than a row
// silently dropped
export type ParsedEntreeRow = {
  id: string;
  designation: string | null;
  reference: string | null;
  longueurValue: number | null;
  longueurUnit: LengthUnit;
  largeurValue: number | null;
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
