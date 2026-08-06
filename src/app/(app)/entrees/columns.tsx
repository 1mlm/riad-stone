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
  return {
    id: "reference",
    label: ENTREE_FIELD_BY_KEY.reference.label,
    icon: ENTREE_FIELD_BY_KEY.reference.icon,
    type: "string",
    monospace: true,
    getString: getReference,
  };
}

export function createDesignationColumn<
  T extends EntreeLikeRow,
>(): CustomTableColumn<T> {
  return {
    id: "designation",
    label: ENTREE_FIELD_BY_KEY.designation.label,
    icon: ENTREE_FIELD_BY_KEY.designation.icon,
    type: "string",
    mergeAdjacent: true,
    getString: (row) => row.designation,
  };
}

export function createDateColumn<
  T extends { date: Date },
>(): CustomTableColumn<T> {
  return {
    id: "date",
    label: ENTREE_FIELD_BY_KEY.date.label,
    icon: ENTREE_FIELD_BY_KEY.date.icon,
    type: "date",
    getDate: (row) => row.date,
  };
}

export function createOrigineColumn<
  T extends EntreeLikeRow,
>(): CustomTableColumn<T> {
  return {
    id: "origine",
    label: ENTREE_FIELD_BY_KEY.origine.label,
    icon: ENTREE_FIELD_BY_KEY.origine.icon,
    type: "string",
    getString: (row) => row.origine ?? "",
  };
}

export function createConteneurColumn<
  T extends EntreeLikeRow,
>(): CustomTableColumn<T> {
  return {
    id: "conteneur",
    label: ENTREE_FIELD_BY_KEY.conteneur.label,
    icon: ENTREE_FIELD_BY_KEY.conteneur.icon,
    type: "string",
    getString: (row) => row.conteneur ?? "",
  };
}

export function createLengthColumn<T extends EntreeLikeRow>(
  key: "longueur" | "largeur",
): CustomTableColumn<T> {
  return {
    id: key,
    label: ENTREE_FIELD_BY_KEY[key].label,
    icon: ENTREE_FIELD_BY_KEY[key].icon,
    type: "string",
    align: "right",
    filterType: "length",
    decimals: 2,
    suffix: "cm",
    getString: (row) => toDisplayLength(row[key]).toFixed(2),
    getNumber: (row) => toDisplayLength(row[key]),
  };
}

export function createSurfacePieceColumn<
  T extends EntreeLikeRow,
>(): CustomTableColumn<T> {
  return {
    id: "surfacePiece",
    label: "Surface de pièce",
    icon: ICONS.surfacePiece,
    type: "string",
    align: "right",
    filterType: "number",
    decimals: 4,
    suffix: "m²",
    getString: (row) => getSurfacePieceM2(row).toFixed(4),
    getNumber: getSurfacePieceM2,
  };
}

export function createNombrePiecesColumn<T extends EntreeLikeRow>(
  labelOverride?: string,
): CustomTableColumn<T> {
  return {
    id: "nombrePieces",
    label: labelOverride ?? ENTREE_FIELD_BY_KEY.nombrePieces.label,
    icon: ENTREE_FIELD_BY_KEY.nombrePieces.icon,
    type: "string",
    align: "right",
    filterType: "number",
    decimals: 0,
    getString: (row) => String(row.nombrePieces),
    getNumber: (row) => row.nombrePieces,
  };
}

export function createSurfaceTotaleColumn<
  T extends EntreeLikeRow,
>(): CustomTableColumn<T> {
  return {
    id: "surfaceTotale",
    label: "Surface d'entrée",
    icon: ICONS.surfaceTotale,
    type: "string",
    align: "right",
    filterType: "number",
    decimals: 4,
    suffix: "m²",
    getString: (row) => getSurfaceTotaleM2(row).toFixed(4),
    getNumber: getSurfaceTotaleM2,
  };
}
