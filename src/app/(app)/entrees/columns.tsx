import { DashboardSquare01Icon, SquareIcon } from "@hugeicons/core-free-icons";
import type { CustomTableColumn } from "@/components/table/CustomTable";
import { ENTREE_FIELD_BY_KEY, toDisplayLength } from "./fields";

type EntreeLikeRow = {
  designation: string;
  origine: string | null;
  longueur: number;
  largeur: number;
  nombrePieces: number;
};

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
    getString: (row) => row.designation,
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

export function createLongueurColumn<
  T extends EntreeLikeRow,
>(): CustomTableColumn<T> {
  return {
    id: "longueur",
    label: ENTREE_FIELD_BY_KEY.longueur.label,
    icon: ENTREE_FIELD_BY_KEY.longueur.icon,
    type: "string",
    align: "right",
    filterType: "number",
    decimals: 2,
    suffix: "cm",
    getString: (row) => `${toDisplayLength(row.longueur).toFixed(2)} cm`,
    getNumber: (row) => toDisplayLength(row.longueur),
  };
}

export function createLargeurColumn<
  T extends EntreeLikeRow,
>(): CustomTableColumn<T> {
  return {
    id: "largeur",
    label: ENTREE_FIELD_BY_KEY.largeur.label,
    icon: ENTREE_FIELD_BY_KEY.largeur.icon,
    type: "string",
    align: "right",
    filterType: "number",
    decimals: 2,
    suffix: "cm",
    getString: (row) => `${toDisplayLength(row.largeur).toFixed(2)} cm`,
    getNumber: (row) => toDisplayLength(row.largeur),
  };
}

export function createSurfacePieceColumn<
  T extends EntreeLikeRow,
>(): CustomTableColumn<T> {
  return {
    id: "surfacePiece",
    label: "Surface de pièce",
    icon: SquareIcon,
    type: "string",
    align: "right",
    filterType: "number",
    decimals: 4,
    suffix: "m²",
    getString: (row) => `${getSurfacePieceM2(row).toFixed(4)} m²`,
    getNumber: getSurfacePieceM2,
  };
}

export function createNombrePiecesColumn<
  T extends EntreeLikeRow,
>(): CustomTableColumn<T> {
  return {
    id: "nombrePieces",
    label: ENTREE_FIELD_BY_KEY.nombrePieces.label,
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
    label: "Surface totale",
    icon: DashboardSquare01Icon,
    type: "string",
    align: "right",
    filterType: "number",
    decimals: 4,
    suffix: "m²",
    getString: (row) => `${getSurfaceTotaleM2(row).toFixed(4)} m²`,
    getNumber: getSurfaceTotaleM2,
  };
}
