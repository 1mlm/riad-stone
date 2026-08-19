import {
  Download01Icon,
  Key01Icon,
  Search02Icon,
} from "@hugeicons/core-free-icons";
import { ENTREE_FIELDS, toDisplayLength } from "@/app/(app)/entrees/fields";
import type { HugeIcon } from "@/components/Icon";
import type { HistorySnapshot } from "@/utils/historySnapshot";
import { ICONS } from "@/utils/icon";

// entree fields come from the single ENTREE_FIELDS source of truth (label
// and icon both); the rest are event-payload shapes that don't belong to
// any entity (login, seeding, sortie-only fields, ...)
const ENTREE_FIELD_META = Object.fromEntries(
  ENTREE_FIELDS.map((field) => [field.key, field]),
);
export const FIELD_META: Record<string, { label: string; icon: HugeIcon }> = {
  ...ENTREE_FIELD_META,
  entreeReference: { label: "Référence de l'entrée", icon: ICONS.reference },
  bonCommande: { label: "Bon de commande", icon: ICONS.bonCommande },
  dateSortie: { label: "Date de sortie", icon: ICONS.date },
  code: { label: "Code utilisé", icon: Key01Icon },
  path: { label: "Page", icon: ICONS.history },
  userAgent: { label: "Appareil", icon: ICONS.details },
  entreesCreated: { label: "Entrées créées", icon: ICONS.pieces },
  sortiesCreated: { label: "Sorties créées", icon: ICONS.pieces },
  entreesCleared: { label: "Entrées supprimées", icon: ICONS.pieces },
  sortiesCleared: { label: "Sorties supprimées", icon: ICONS.pieces },
  query: { label: "Recherche", icon: Search02Icon },
  filePrefix: { label: "Table", icon: ICONS.details },
  format: { label: "Format", icon: Download01Icon },
  rowCount: { label: "Lignes exportées", icon: ICONS.pieces },
};

// jsonb doesn't preserve key insertion order on round-trip, so a snapshot's
// field order can't be trusted — sort against FIELD_META's order instead,
// which mirrors ENTREE_FIELDS
const FIELD_ORDER = Object.keys(FIELD_META);
function orderFields(fields: string[]): string[] {
  return [...fields].sort(
    (a, b) => FIELD_ORDER.indexOf(a) - FIELD_ORDER.indexOf(b),
  );
}

// for an update event, only the fields that actually changed are worth
// showing — a désignation edit doesn't need to drag the other 9 entrée
// fields along just to prove they stayed the same
export function getDisplayFields(
  current: HistorySnapshot,
  before?: HistorySnapshot,
): string[] {
  const fields = orderFields(Object.keys(current));
  if (!before) return fields;
  return fields.filter((field) => before[field] !== current[field]);
}

export function formatFieldValue(field: string, value: unknown): string {
  if (value === null || value === undefined || value === "") return "-";
  if (field === "date" || field === "dateSortie")
    return new Date(value as string).toLocaleDateString("fr-FR");
  if (field === "longueur" || field === "largeur")
    return `${toDisplayLength(Number(value)).toFixed(2)} cm`;
  return String(value);
}
