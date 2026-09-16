import { LENGTH_UNITS, type LengthUnit } from "@/utils/length";

const UNIT_PATTERN = new RegExp(`\\b(${LENGTH_UNITS.join("|")})\\b`);

// "Longueur (cm)" or "Largeur en m" names its own unit explicitly — that
// beats guessing from the numbers' magnitude, so it's checked first and only
// falls through to the per-table magnitude heuristic when a header doesn't
// say. Matched on a word boundary so "cm"/"m" have to stand alone (inside
// parens, after "en", ...) rather than happening to be a substring of some
// other word
export function lengthUnitFromHeader(
  headerText: string,
): LengthUnit | undefined {
  const normalized = headerText
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
  const match = normalized.match(UNIT_PATTERN);
  return match ? (match[1] as LengthUnit) : undefined;
}
