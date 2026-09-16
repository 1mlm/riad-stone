import type { ParsedEntreeRow } from "./types";

// which of a row's fields are the reason it can't be imported yet — the
// preview highlights exactly these, rather than a single "this row is
// invalid" flag, so fixing a row is "type into the field that's red" and
// not a guessing game
export type RowFieldError =
  | "designation"
  | "reference"
  | "longueurValue"
  | "largeurValue"
  | "nombrePieces"
  | "duplicateReference";

export function getRowFieldErrors(
  row: ParsedEntreeRow,
  referenceCounts: Map<string, number>,
  existingReferences: Set<string>,
): Set<RowFieldError> {
  const errors = new Set<RowFieldError>();
  if (!row.designation) errors.add("designation");
  if (!row.reference) errors.add("reference");
  if (row.longueurValue === null || row.longueurValue <= 0)
    errors.add("longueurValue");
  if (row.largeurValue === null || row.largeurValue <= 0)
    errors.add("largeurValue");
  if (row.nombrePieces === null || row.nombrePieces <= 0)
    errors.add("nombrePieces");

  if (
    row.reference &&
    ((referenceCounts.get(row.reference) ?? 0) > 1 ||
      existingReferences.has(row.reference))
  )
    errors.add("duplicateReference");

  return errors;
}

// how many rows in the batch currently share each non-empty reference —
// the input to the duplicate check above, recomputed whenever any row's
// reference changes
export function countReferences(rows: ParsedEntreeRow[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const row of rows) {
    if (!row.reference) continue;
    counts.set(row.reference, (counts.get(row.reference) ?? 0) + 1);
  }
  return counts;
}
