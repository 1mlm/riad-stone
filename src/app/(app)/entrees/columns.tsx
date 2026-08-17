import type { HugeIcon } from "@/components/Icon";
import type { CustomTableColumn } from "@/components/table/CustomTable";
import { ICONS } from "@/utils/icon";
import { ENTREE_FIELD_BY_KEY, toDisplayLength } from "./fields";

type EntreeLikeRow = {
  designation: string;
  origine: string | null;
  conteneur: string | null;
  longueur: number;
  largeur: number;
  nombrePieces: number;
};

// entree-shaped tables (entrees, stock) group by designation first, then show
// the newest reference of each group on top
export const DESIGNATION_THEN_REFERENCE_SORT = [
  { columnId: "designation", dir: "asc" as const },
  { columnId: "reference", dir: "desc" as const },
];

export const getSurfacePieceM2 = (row: EntreeLikeRow) =>
  row.longueur * row.largeur;
export const getSurfaceTotaleM2 = (row: EntreeLikeRow) =>
  getSurfacePieceM2(row) * row.nombrePieces;

export function createReferenceColumn<T>(
  getReference: (row: T) => string,
): CustomTableColumn<T> {
  const { label, icon } = ENTREE_FIELD_BY_KEY.reference;
  return {
    id: "reference",
    label,
    icon,
    type: "string",
    monospace: true,
    getString: getReference,
  };
}

export function createDesignationColumn<
  T extends EntreeLikeRow,
>(): CustomTableColumn<T> {
  const { label, icon } = ENTREE_FIELD_BY_KEY.designation;
  return {
    id: "designation",
    label,
    icon,
    type: "string",
    mergeAdjacent: true,
    getString: (row) => row.designation,
  };
}

export function createDateColumn<
  T extends { date: Date },
>(): CustomTableColumn<T> {
  const { label, icon } = ENTREE_FIELD_BY_KEY.date;
  return {
    id: "date",
    label,
    icon,
    type: "date",
    relative: false,
    getDate: (row) => row.date,
  };
}

export function createOrigineColumn<
  T extends EntreeLikeRow,
>(): CustomTableColumn<T> {
  const { label, icon } = ENTREE_FIELD_BY_KEY.origine;
  return {
    id: "origine",
    label,
    icon,
    type: "string",
    getString: (row) => row.origine ?? "",
  };
}

export function createConteneurColumn<
  T extends EntreeLikeRow,
>(): CustomTableColumn<T> {
  const { label, icon } = ENTREE_FIELD_BY_KEY.conteneur;
  return {
    id: "conteneur",
    label,
    icon,
    type: "string",
    getString: (row) => row.conteneur ?? "",
  };
}

// shared shape behind every right-aligned numeric column: decimal-aligned
// rendering, a min/max range filter, and getString derived from getNumber
// unless the column needs to show something other than its own number (e.g.
// blank for single-lot groups) — decimals and getNumber must travel together
// since CustomTableCell/getColumnExportValue key AlignedNumber rendering off
// decimals alone
function createNumericColumn<T>({
  id,
  label,
  icon,
  decimals,
  suffix,
  filterType = "number",
  mergeAdjacent,
  getMergeKey,
  getNumber,
  getString,
}: {
  id: string;
  label: string;
  icon: HugeIcon;
  decimals: number;
  suffix?: string;
  filterType?: "number" | "length";
  mergeAdjacent?: boolean;
  getMergeKey?: (row: T) => string;
  getNumber: (row: T) => number;
  getString?: (row: T) => string;
}): CustomTableColumn<T> {
  return {
    id,
    label,
    icon,
    type: "string",
    align: "right",
    filterType,
    decimals,
    suffix,
    mergeAdjacent,
    getMergeKey,
    getNumber,
    getString: getString ?? ((row) => getNumber(row).toFixed(decimals)),
  };
}

export function createLengthColumn<T extends EntreeLikeRow>(
  key: "longueur" | "largeur",
): CustomTableColumn<T> {
  const { label, icon } = ENTREE_FIELD_BY_KEY[key];
  return createNumericColumn({
    id: key,
    label,
    icon,
    filterType: "length",
    decimals: 2,
    suffix: "cm",
    getNumber: (row) => toDisplayLength(row[key]),
  });
}

export function createSurfacePieceColumn<
  T extends EntreeLikeRow,
>(): CustomTableColumn<T> {
  return createNumericColumn({
    id: "surfacePiece",
    label: "Surface de pièce",
    icon: ICONS.surfacePiece,
    decimals: 4,
    suffix: "m²",
    getNumber: getSurfacePieceM2,
  });
}

export function createNombrePiecesColumn<T extends EntreeLikeRow>(
  labelOverride?: string,
): CustomTableColumn<T> {
  return createNumericColumn({
    id: "nombrePieces",
    label: labelOverride ?? ENTREE_FIELD_BY_KEY.nombrePieces.label,
    icon: ENTREE_FIELD_BY_KEY.nombrePieces.icon,
    decimals: 0,
    getNumber: (row) => row.nombrePieces,
  });
}

export function createSurfaceTotaleColumn<T extends EntreeLikeRow>(
  labelOverride?: string,
): CustomTableColumn<T> {
  return createNumericColumn({
    id: "surfaceTotale",
    label: labelOverride ?? "Surface d'entrée",
    icon: ICONS.surfaceTotale,
    decimals: 4,
    suffix: "m²",
    getNumber: getSurfaceTotaleM2,
  });
}

// sum of every row's surface totale sharing that designation, repeated on
// each of that designation's rows — computed once over all rows so it
// doesn't shift as the user searches/filters. Left blank for designations
// with a single lot, where it would just repeat surfaceTotale
export function createSurfaceDesignationColumn<T extends EntreeLikeRow>(
  items: T[],
): CustomTableColumn<T> {
  const totalsByDesignation = new Map<string, number>();
  const countByDesignation = new Map<string, number>();
  for (const row of items) {
    totalsByDesignation.set(
      row.designation,
      (totalsByDesignation.get(row.designation) ?? 0) + getSurfaceTotaleM2(row),
    );
    countByDesignation.set(
      row.designation,
      (countByDesignation.get(row.designation) ?? 0) + 1,
    );
  }

  return createNumericColumn({
    id: "surfaceDesignation",
    label: "Surface de désignation",
    icon: ICONS.surfaceDesignation,
    decimals: 4,
    suffix: "m²",
    mergeAdjacent: true,
    getMergeKey: (row) => row.designation,
    getNumber: (row) => totalsByDesignation.get(row.designation) ?? 0,
    getString: (row) =>
      (countByDesignation.get(row.designation) ?? 0) > 1
        ? (totalsByDesignation.get(row.designation) ?? 0).toFixed(4)
        : "",
  });
}
