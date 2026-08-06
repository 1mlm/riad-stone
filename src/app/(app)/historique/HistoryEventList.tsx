"use client";

import {
  Delete02Icon,
  EditIcon,
  Key01Icon,
  LogoutIcon,
  NuclearPowerIcon,
  Plant01Icon,
  PlusSignIcon,
} from "@hugeicons/core-free-icons";
import { Suspense, useState } from "react";
import {
  ENTREE_FIELD_BY_KEY,
  toDisplayLength,
} from "@/app/(app)/entrees/fields";
import { MetaPage } from "@/components/MetaPage";
import { SearchBar } from "@/components/SearchBar";
import {
  CustomTable,
  type CustomTableColumn,
  type CustomTableEnumValue,
} from "@/components/table/CustomTable";
import type { HistoryEvent } from "@/generated/prisma/client";
import { HistoryItemType } from "@/generated/prisma/enums";
import { cn } from "@/shadcn/utils";
import type { DeviceInfo } from "@/utils/deviceInfo";
import {
  getEventReference,
  getEventSnapshots,
  type HistorySnapshot,
} from "@/utils/historySnapshot";
import { ICONS } from "@/utils/icon";
import { RevealSecretValue } from "./RevealSecretValue";

const TYPE_META: Record<HistoryItemType, CustomTableEnumValue> = {
  [HistoryItemType.CREATE_INPUT]: {
    icon: PlusSignIcon,
    color: "green",
    label: "Entrée ajoutée",
  },
  [HistoryItemType.UPDATE_INPUT]: {
    icon: EditIcon,
    color: "amber",
    label: "Entrée modifiée",
  },
  [HistoryItemType.DELETE_INPUT]: {
    icon: Delete02Icon,
    color: "red",
    label: "Entrée supprimée",
  },
  [HistoryItemType.CREATE_OUTPUT]: {
    icon: PlusSignIcon,
    color: "green",
    label: "Sortie ajoutée",
  },
  [HistoryItemType.UPDATE_OUTPUT]: {
    icon: EditIcon,
    color: "amber",
    label: "Sortie modifiée",
  },
  [HistoryItemType.DELETE_OUTPUT]: {
    icon: Delete02Icon,
    color: "red",
    label: "Sortie supprimée",
  },
  [HistoryItemType.CLEAR_EVERYTHING]: {
    icon: NuclearPowerIcon,
    color: "red",
    label: "Toutes les données effacées",
  },
  [HistoryItemType.SEED_FAKE_DATA]: {
    icon: Plant01Icon,
    color: "green",
    label: "Données fictives ajoutées",
  },
  [HistoryItemType.LOGIN]: {
    icon: Key01Icon,
    color: "gray",
    label: "Connexion",
  },
  [HistoryItemType.LOGOUT]: {
    icon: LogoutIcon,
    color: "gray",
    label: "Déconnexion",
  },
};

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
  userAgent: "Appareil",
  entreesCreated: "Entrées créées",
  sortiesCreated: "Sorties créées",
  entreesCleared: "Entrées supprimées",
  sortiesCleared: "Sorties supprimées",
};

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
  if (value === null || value === undefined || value === "") return "-";
  if (field === "date" || field === "dateSortie")
    return new Date(value as string).toLocaleDateString("fr-FR");
  if (field === "longueur" || field === "largeur")
    return `${toDisplayLength(Number(value)).toFixed(2)} cm`;
  return String(value);
}

// best-effort: renders whatever shows up. Legacy rows stored a plain string,
// current ones a DeviceInfo blob — every field in that blob is itself
// optional since browser/os/device/geo only fill in when detectable
function DeviceInfoCell({ value }: { value: unknown }) {
  if (typeof value === "string") return <>{value}</>;
  if (!value || typeof value !== "object") return <>-</>;

  const info = value as Partial<DeviceInfo>;
  const summary = [
    info.browser?.name &&
      `${info.browser.name} ${info.browser.version ?? ""}`.trim(),
    info.os?.name && `${info.os.name} ${info.os.version ?? ""}`.trim(),
    info.device?.type &&
      (info.device.model
        ? `${info.device.model} (${info.device.type})`
        : info.device.type),
  ].filter(Boolean);
  const location = [info.geo?.city, info.geo?.country].filter(Boolean);

  return (
    <div className="flex flex-col gap-0.5 py-1">
      {summary.length > 0 && <span>{summary.join(" · ")}</span>}
      {(location.length > 0 || info.geo?.flag) && (
        <span className="text-muted-foreground">
          {info.geo?.flag} {location.join(", ")}
        </span>
      )}
      {info.ip && (
        <span className="font-mono text-muted-foreground">{info.ip}</span>
      )}
      {info.userAgent && (
        <span
          className="block max-w-64 truncate text-muted-foreground"
          title={info.userAgent}
        >
          {info.userAgent}
        </span>
      )}
    </div>
  );
}

function HistoryDataTable({
  eventId,
  current,
  before,
}: {
  eventId: number;
  current: HistorySnapshot;
  before?: HistorySnapshot;
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
                    field === "bonCommande" && "font-mono",
                    changed && "text-muted-foreground line-through",
                  )}
                >
                  {formatFieldValue(field, before[field])}
                </td>
              )}
              <td
                className={cn(
                  "py-1",
                  field === "bonCommande" && "font-mono",
                  changed && "font-medium text-amber-600",
                )}
              >
                {field === "code" && current[field] ? (
                  <RevealSecretValue {...{ eventId }} />
                ) : field === "userAgent" ? (
                  <DeviceInfoCell value={current[field]} />
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

function HistoryEventListContent({
  events,
  emptyTitle,
  emptySubtitle,
}: {
  events: HistoryEvent[];
  emptyTitle: string;
  emptySubtitle: string;
}) {
  const [resultCount, setResultCount] = useState(events.length);

  if (events.length === 0)
    return (
      <MetaPage
        icon={ICONS.history}
        title={emptyTitle}
        subtitle={emptySubtitle}
      />
    );

  const columns: CustomTableColumn<HistoryEvent>[] = [
    {
      id: "type",
      label: "Type",
      icon: ICONS.history,
      type: "enum",
      enumOptions: TYPE_META,
      getValue: (event) => event.type,
      getPopoverContent: (event) => {
        const { before, current } = getEventSnapshots(event.type, event.data);
        return <HistoryDataTable eventId={event.id} {...{ current, before }} />;
      },
    },
    {
      id: "reference",
      label: "Référence",
      icon: ICONS.reference,
      type: "string",
      monospace: true,
      getString: (event) => getEventReference(event.type, event.data) ?? "",
    },
    {
      id: "date",
      label: "Date",
      icon: ICONS.date,
      type: "date",
      getDate: (event) => event.createdAt,
    },
  ];

  return (
    <div className="flex w-full flex-col gap-3">
      <SearchBar
        placeholder="Rechercher dans l'historique..."
        queryKey="hq"
        {...{ resultCount }}
      />
      <CustomTable
        items={events}
        {...{ columns }}
        getItemId={(event) => String(event.id)}
        exportFilePrefix="historique"
        filterable={false}
        searchQueryKey="hq"
        pageQueryKey="hpage"
        sortQueryKey="hsort"
        defaultSort={[{ columnId: "date", dir: "desc" }]}
        onVisibleCountChange={setResultCount}
      />
    </div>
  );
}

export function HistoryEventList({
  events,
  emptyTitle = "Aucun historique",
  emptySubtitle = "Les actions effectuées apparaîtront ici.",
}: {
  events: HistoryEvent[];
  emptyTitle?: string;
  emptySubtitle?: string;
}) {
  return (
    <Suspense>
      <HistoryEventListContent {...{ events, emptyTitle, emptySubtitle }} />
    </Suspense>
  );
}
