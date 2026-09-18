import { ICONS } from "@/utils/icon";
import type { ParsedEntreeRow } from "./types";

// one column per editable field, driving both the header row and sorting —
// a new field only needs an entry here, not a hand-written <th> plus a case
// in the sort comparator
export const PREVIEW_COLUMNS = [
  {
    key: "reference",
    label: "Référence",
    icon: ICONS.reference,
    numeric: false,
  },
  {
    key: "designation",
    label: "Désignation",
    icon: ICONS.designation,
    numeric: false,
  },
  {
    key: "longueurValue",
    label: "Longueur",
    icon: ICONS.length,
    numeric: true,
  },
  { key: "largeurValue", label: "Largeur", icon: ICONS.width, numeric: true },
  { key: "nombrePieces", label: "Pièces", icon: ICONS.pieces, numeric: true },
  { key: "date", label: "Date", icon: ICONS.date, numeric: false },
  { key: "origine", label: "Origine", icon: ICONS.location, numeric: false },
  {
    key: "conteneur",
    label: "N° conteneur",
    icon: ICONS.conteneur,
    numeric: false,
  },
  {
    key: "commentaire",
    label: "Commentaire",
    icon: ICONS.commentaire,
    numeric: false,
  },
] as const;

export type PreviewColumnKey = (typeof PREVIEW_COLUMNS)[number]["key"];

export type PreviewSort = {
  column: PreviewColumnKey;
  dir: "asc" | "desc";
} | null;

function getSortValue(row: ParsedEntreeRow, column: PreviewColumnKey) {
  return row[column];
}

// a row missing the sorted field always sorts to the end, in either
// direction — an empty désignation reads as "not filled in yet", not as
// alphabetically first or numerically zero
export function sortRows(
  rows: ParsedEntreeRow[],
  sort: PreviewSort,
): ParsedEntreeRow[] {
  if (!sort) return rows;
  const factor = sort.dir === "asc" ? 1 : -1;
  return [...rows].sort((a, b) => {
    const av = getSortValue(a, sort.column);
    const bv = getSortValue(b, sort.column);
    const aEmpty = av === null || av === "";
    const bEmpty = bv === null || bv === "";
    if (aEmpty && bEmpty) return 0;
    if (aEmpty) return 1;
    if (bEmpty) return -1;
    if (typeof av === "number" && typeof bv === "number")
      return (av - bv) * factor;
    return String(av).localeCompare(String(bv)) * factor;
  });
}

export function filterRows(
  rows: ParsedEntreeRow[],
  query: string,
): ParsedEntreeRow[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return rows;
  return rows.filter((row) =>
    PREVIEW_COLUMNS.map(({ key }) => row[key])
      .filter((value) => value !== null)
      .join(" ")
      .toLowerCase()
      .includes(normalized),
  );
}
