import { normalizeHeader } from "./normalize";

export type ImportField =
  | "designation"
  | "reference"
  | "longueur"
  | "largeur"
  | "nombrePieces"
  | "date"
  | "origine"
  | "conteneur"
  | "commentaire";

// a header cell (column header or a metadata row's label cell, e.g. "Date"
// above a table) is matched against a field two ways: an exact alias after
// normalizing, or — for the fields whose real-world spellings vary the most
// ("Nb de Pièce", "Nbr Piéce", "NOMBRE DE PIECES") — a substring that's
// reliable enough on its own once accents and spacing are gone
const EXACT_ALIASES: Record<ImportField, string[]> = {
  designation: ["designation", "design", "produit", "article", "nom"],
  reference: [
    "reference",
    "ref",
    "codearticle",
    "code",
    "bloc",
    "block",
    "numerodebloc",
    "nblock",
  ],
  longueur: ["longueur", "long", "length", "l"],
  largeur: ["largeur", "larg", "width", "w"],
  nombrePieces: ["nombredepieces", "nbpieces", "nbrpieces", "qte", "quantite"],
  date: ["date"],
  origine: ["origine", "origin", "provenance", "pays"],
  conteneur: ["conteneur", "contenir", "container", "numerodeconteneur"],
  commentaire: ["commentaire", "comment", "remarque", "remarques", "notes"],
};

const SUBSTRING_FALLBACKS: Partial<Record<ImportField, string[]>> = {
  longueur: ["long"],
  largeur: ["larg", "width"],
  nombrePieces: ["piece"],
  conteneur: ["conten"],
  reference: ["ref", "bloc"],
};

export function matchesField(headerText: string, field: ImportField): boolean {
  const normalized = normalizeHeader(headerText);
  if (!normalized) return false;
  if (EXACT_ALIASES[field].includes(normalized)) return true;
  return (SUBSTRING_FALLBACKS[field] ?? []).some((needle) =>
    normalized.includes(needle),
  );
}

// which field, if any, a header cell refers to — first field that matches,
// in a fixed priority order so e.g. "Référence" isn't mistaken for anything
// looser before it gets a chance to match exactly
const FIELD_PRIORITY: ImportField[] = [
  "designation",
  "reference",
  "date",
  "longueur",
  "largeur",
  "nombrePieces",
  "conteneur",
  "origine",
  "commentaire",
];

export function identifyField(headerText: string): ImportField | undefined {
  return FIELD_PRIORITY.find((field) => matchesField(headerText, field));
}

// the fields a header ROW needs to show before it's trusted as a table's
// header rather than some unrelated row of text — reference is deliberately
// excluded: some real packing lists have no per-row unique id column at all,
// even though "N° Block"/"Bloc" often is one (it maps to reference above)
export const REQUIRED_HEADER_FIELDS: ImportField[] = [
  "designation",
  "longueur",
  "largeur",
  "nombrePieces",
];
