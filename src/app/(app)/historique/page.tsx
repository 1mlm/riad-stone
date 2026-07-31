import {
  Delete02Icon,
  EditIcon,
  Key01Icon,
  LogoutIcon,
  NuclearPowerIcon,
  Plant01Icon,
  PlusSignIcon,
  ScrollIcon,
} from "@hugeicons/core-free-icons";
import {
  ENTREE_FIELD_BY_KEY,
  toDisplayLength,
} from "@/app/(app)/entrees/fields";
import type { HugeIcon } from "@/components/Icon";
import { Icon } from "@/components/Icon";
import { MetaPage } from "@/components/MetaPage";
import { DateCell } from "@/components/table/CustomTableCell";
import { HistoryItemType } from "@/generated/prisma/enums";
import { cn } from "@/shadcn/utils";
import { getRelativeBucket, type RelativeBucket } from "@/utils/date";
import { prisma } from "@/utils/prisma";
import { RevealSecretValue } from "./RevealSecretValue";

const TYPE_META: Record<
  HistoryItemType,
  { icon: HugeIcon; className: string; label: string }
> = {
  [HistoryItemType.CREATE_INPUT]: {
    icon: PlusSignIcon,
    className: "text-green-500",
    label: "Entrée ajoutée",
  },
  [HistoryItemType.UPDATE_INPUT]: {
    icon: EditIcon,
    className: "text-amber-500",
    label: "Entrée modifiée",
  },
  [HistoryItemType.DELETE_INPUT]: {
    icon: Delete02Icon,
    className: "text-destructive",
    label: "Entrée supprimée",
  },
  [HistoryItemType.CREATE_OUTPUT]: {
    icon: PlusSignIcon,
    className: "text-green-500",
    label: "Sortie ajoutée",
  },
  [HistoryItemType.UPDATE_OUTPUT]: {
    icon: EditIcon,
    className: "text-amber-500",
    label: "Sortie modifiée",
  },
  [HistoryItemType.DELETE_OUTPUT]: {
    icon: Delete02Icon,
    className: "text-destructive",
    label: "Sortie supprimée",
  },
  [HistoryItemType.CLEAR_EVERYTHING]: {
    icon: NuclearPowerIcon,
    className: "text-destructive",
    label: "Toutes les données effacées",
  },
  [HistoryItemType.SEED_FAKE_DATA]: {
    icon: Plant01Icon,
    className: "text-green-500",
    label: "Données fictives ajoutées",
  },
  [HistoryItemType.LOGIN]: {
    icon: Key01Icon,
    className: "text-muted-foreground",
    label: "Connexion",
  },
  [HistoryItemType.LOGOUT]: {
    icon: LogoutIcon,
    className: "text-muted-foreground",
    label: "Déconnexion",
  },
};

const UPDATE_TYPES: HistoryItemType[] = [
  HistoryItemType.UPDATE_INPUT,
  HistoryItemType.UPDATE_OUTPUT,
];

const ENTREE_FIELD_LABELS = Object.fromEntries(
  Object.entries(ENTREE_FIELD_BY_KEY).map(([key, field]) => [key, field.label]),
);

// entree fields come from the single ENTREE_FIELDS source of truth; the rest
// are event-payload shapes that don't belong to any entity (login, seeding, ...)
const FIELD_LABELS: Record<string, string> = {
  ...ENTREE_FIELD_LABELS,
  entreeReference: "Référence de l'entrée",
  bonCommande: "Bon de commande",
  dateSortie: "Date de sortie",
  code: "Code utilisé",
  entreesCreated: "Entrées créées",
  sortiesCreated: "Sorties créées",
  entreesCleared: "Entrées supprimées",
  sortiesCleared: "Sorties supprimées",
};

const BUCKET_LABELS: Record<RelativeBucket, string> = {
  today: "Aujourd'hui",
  yesterday: "Hier",
  week: "Cette semaine",
  month: "Ce mois-ci",
  earlier: "Plus ancien",
};
const BUCKET_ORDER: RelativeBucket[] = [
  "today",
  "yesterday",
  "week",
  "month",
  "earlier",
];

type Snapshot = Record<string, unknown>;

// jsonb doesn't preserve key insertion order on round-trip, so a snapshot's
// field order can't be trusted — sort against FIELD_LABELS' order instead,
// which mirrors ENTREE_FIELDS
const FIELD_ORDER = Object.keys(FIELD_LABELS);
function orderFields(fields: string[]): string[] {
  return [...fields].sort(
    (a, b) => FIELD_ORDER.indexOf(a) - FIELD_ORDER.indexOf(b),
  );
}

function formatFieldValue(field: string, value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";
  if (field === "date" || field === "dateSortie")
    return new Date(value as string).toLocaleDateString("fr-FR");
  if (field === "longueur" || field === "largeur")
    return `${toDisplayLength(Number(value)).toFixed(2)} cm`;
  return String(value);
}

function getEventSnapshots(
  type: HistoryItemType,
  data: unknown,
): { before?: Snapshot; current: Snapshot } {
  if (UPDATE_TYPES.includes(type)) {
    const { before, after } = data as { before: Snapshot; after: Snapshot };
    return { before, current: after };
  }
  return { current: data as Snapshot };
}

function HistoryDataTable({
  current,
  before,
}: {
  current: Snapshot;
  before?: Snapshot;
}) {
  const fields = orderFields(Object.keys(current));
  if (fields.length === 0) return null;

  return (
    <table className="w-full text-xs">
      <tbody>
        {fields.map((field) => {
          const changed = before && before[field] !== current[field];
          return (
            <tr key={field} className="border-t border-border/50">
              <td className="py-1 pr-3 whitespace-nowrap text-muted-foreground">
                {FIELD_LABELS[field] ?? field}
              </td>
              {before && (
                <td
                  className={cn(
                    "py-1 pr-3",
                    changed && "text-muted-foreground line-through",
                  )}
                >
                  {formatFieldValue(field, before[field])}
                </td>
              )}
              <td
                className={cn("py-1", changed && "font-medium text-amber-600")}
              >
                {field === "code" && current[field] ? (
                  <RevealSecretValue value={String(current[field])} />
                ) : (
                  formatFieldValue(field, current[field])
                )}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

export default async function HistoriquePage() {
  const events = await prisma.historyEvent.findMany({
    orderBy: { createdAt: "desc" },
  });

  const eventsByBucket = Object.groupBy(events, (event) =>
    getRelativeBucket(event.createdAt),
  );

  if (events.length === 0)
    return (
      <MetaPage
        icon={ScrollIcon}
        title="Aucun historique"
        subtitle="Les actions effectuées apparaîtront ici."
        className="h-full"
      />
    );

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-6 p-5">
      {BUCKET_ORDER.filter((bucket) => eventsByBucket[bucket]?.length).map(
        (bucket) => (
          <div key={bucket} className="flex flex-col gap-2">
            <h2 className="text-sm font-semibold text-muted-foreground">
              {BUCKET_LABELS[bucket]}
            </h2>
            <ul className="flex flex-col gap-2">
              {eventsByBucket[bucket]?.map((event) => {
                const { icon, className, label } = TYPE_META[event.type];
                const { before, current } = getEventSnapshots(
                  event.type,
                  event.data,
                );
                const reference = String(
                  current.reference ?? current.entreeReference ?? "",
                );
                return (
                  <li
                    key={event.id}
                    className="flex flex-col gap-2 rounded-lg border border-border px-3 py-2"
                  >
                    <div className="flex items-center gap-3">
                      <Icon icon={icon} className={className} />
                      <DateCell date={event.createdAt} />
                      <span className="text-sm font-medium">
                        {label}
                        {reference && ` — ${reference}`}
                      </span>
                    </div>
                    <HistoryDataTable {...{ current, before }} />
                  </li>
                );
              })}
            </ul>
          </div>
        ),
      )}
    </div>
  );
}
