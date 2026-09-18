import { type LengthUnit, lengthToMeters, metersToUnit } from "@/utils/length";
import type { ParsedEntreeRow } from "./types";

// the manual add form only ever accepts a whole number in whichever unit is
// picked (see UnitLengthInput's step="1") — a value read off a sheet is
// re-expressed here as a rounded whole number of cm, the one unit fine
// enough to hold any realistic tile/slab measurement without losing
// anything a packing list would actually record. This keeps every imported
// row immediately compatible with the same UnitLengthInput control and the
// same integer check the manual form uses
export function toWholeCm(
  value: number | null,
  unit: LengthUnit,
): number | null {
  return value === null
    ? null
    : Math.round(metersToUnit(lengthToMeters(value, unit), "cm"));
}

// recomputes every row's longueurValue/largeurValue from its untouched raw
// number under a newly-picked unit — a correction for "the parser guessed
// this table's unit wrong", applied once for the whole table instead of row
// by row. Rows without a raw value (blank cell) are left alone
export function reinterpretLongueurUnit(
  rows: ParsedEntreeRow[],
  unit: LengthUnit,
): ParsedEntreeRow[] {
  return rows.map((row) => ({
    ...row,
    longueurValue: toWholeCm(row.longueurRawValue, unit),
  }));
}

export function reinterpretLargeurUnit(
  rows: ParsedEntreeRow[],
  unit: LengthUnit,
): ParsedEntreeRow[] {
  return rows.map((row) => ({
    ...row,
    largeurValue: toWholeCm(row.largeurRawValue, unit),
  }));
}
