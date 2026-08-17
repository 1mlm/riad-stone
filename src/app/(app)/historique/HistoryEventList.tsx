"use client";

import {
  Delete02Icon,
  EditIcon,
  ExpandIcon,
  Key01Icon,
  LogoutIcon,
  NuclearPowerIcon,
  Plant01Icon,
  PlusSignIcon,
} from "@hugeicons/core-free-icons";
import { Suspense, useState } from "react";
import { ENTREE_FIELDS, toDisplayLength } from "@/app/(app)/entrees/fields";
import type { HugeIcon } from "@/components/Icon";
import { Icon } from "@/components/Icon";
import { MetaPage } from "@/components/MetaPage";
import { SearchBar } from "@/components/SearchBar";
import {
  buildRowSummary,
  CustomTable,
  type CustomTableColumn,
  type CustomTableEnumValue,
} from "@/components/table/CustomTable";
import {
  CopyRowMenuItem,
  RowMenuItemButton,
} from "@/components/table/RowContextMenu";
import type { HistoryEvent } from "@/generated/prisma/client";
import { HistoryItemType } from "@/generated/prisma/enums";
import { fr } from "@/messages/fr";
import { Popover, PopoverContent, PopoverTrigger } from "@/shadcn/ui/popover";
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

// entree fields come from the single ENTREE_FIELDS source of truth (label
// and icon both); the rest are event-payload shapes that don't belong to
// any entity (login, seeding, sortie-only fields, ...)
const ENTREE_FIELD_META = Object.fromEntries(
  ENTREE_FIELDS.map((field) => [field.key, field]),
);
const FIELD_META: Record<string, { label: string; icon: HugeIcon }> = {
  ...ENTREE_FIELD_META,
  entreeReference: { label: "Référence de l'entrée", icon: ICONS.reference },
  bonCommande: { label: "Bon de commande", icon: ICONS.bonCommande },
  dateSortie: { label: "Date de sortie", icon: ICONS.date },
  code: { label: "Code utilisé", icon: Key01Icon },
  userAgent: { label: "Appareil", icon: ICONS.details },
  entreesCreated: { label: "Entrées créées", icon: ICONS.pieces },
  sortiesCreated: { label: "Sorties créées", icon: ICONS.pieces },
  entreesCleared: { label: "Entrées supprimées", icon: ICONS.pieces },
  sortiesCleared: { label: "Sorties supprimées", icon: ICONS.pieces },
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
function getDisplayFields(
  current: HistorySnapshot,
  before?: HistorySnapshot,
): string[] {
  const fields = orderFields(Object.keys(current));
  if (!before) return fields;
  return fields.filter((field) => before[field] !== current[field]);
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

function FieldValue({
  field,
  value,
  eventId,
}: {
  field: string;
  value: unknown;
  eventId: number;
}) {
  if (field === "code" && value) return <RevealSecretValue {...{ eventId }} />;
  if (field === "userAgent") return <DeviceInfoCell {...{ value }} />;
  return <>{formatFieldValue(field, value)}</>;
}

// one field per column (icon + label header), one row per snapshot — before
// & after for an update, just current otherwise — instead of the old
// per-field "label, previous, next" layout, so every popover in the app
// reads the same way regardless of how many fields it's showing
function HistoryDataTable({
  eventId,
  current,
  before,
}: {
  eventId: number;
  current: HistorySnapshot;
  before?: HistorySnapshot;
}) {
  const fields = getDisplayFields(current, before);
  if (fields.length === 0) return null;

  return (
    <div className="overflow-x-auto">
      <table className="text-xs">
        <thead>
          <tr>
            {fields.map((field) => {
              const meta = FIELD_META[field];
              return (
                <th
                  key={field}
                  className="border-b border-border/50 px-3 py-1.5 text-left font-medium whitespace-nowrap text-muted-foreground"
                >
                  <span className="flex items-center gap-1.5">
                    <Icon icon={meta?.icon ?? ICONS.details} />
                    {meta?.label ?? field}
                  </span>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {before && (
            <tr>
              {fields.map((field) => (
                <td
                  key={field}
                  className={cn(
                    "px-3 py-1.5 text-destructive line-through decoration-dashed",
                    field === "bonCommande" && "font-mono",
                  )}
                >
                  <FieldValue {...{ field, eventId }} value={before[field]} />
                </td>
              ))}
            </tr>
          )}
          <tr>
            {fields.map((field) => (
              <td
                key={field}
                className={cn(
                  "px-3 py-1.5",
                  field === "bonCommande" && "font-mono",
                  before && "font-bold text-green-600",
                )}
              >
                <FieldValue {...{ field, eventId }} value={current[field]} />
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
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
      id: "actions",
      label: "Actions",
      icon: ICONS.actions,
      type: "buttons",
      getButtons: (event, selectItem) => {
        const { before, current } = getEventSnapshots(event.type, event.data);
        const hasDetails = getDisplayFields(current, before).length > 0;
        return (
          <>
            {hasDetails && (
              <Popover>
                <PopoverTrigger asChild>
                  <RowMenuItemButton icon={ExpandIcon}>
                    Détails
                  </RowMenuItemButton>
                </PopoverTrigger>
                <PopoverContent className="w-auto max-w-[calc(100vw-2rem)] max-h-(--radix-popover-content-available-height) overflow-y-auto">
                  <HistoryDataTable
                    eventId={event.id}
                    {...{ current, before }}
                  />
                </PopoverContent>
              </Popover>
            )}
            {selectItem}
            <CopyRowMenuItem
              value={buildRowSummary(columns, event, fr.common.locale)}
              label="Copier"
              copiedLabel="Copié"
            />
          </>
        );
      },
    },
    {
      id: "type",
      label: "Type",
      icon: ICONS.history,
      type: "enum",
      enumOptions: TYPE_META,
      getValue: (event) => event.type,
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
      <div className="sticky top-20 z-10 bg-background py-1 sm:top-0">
        <SearchBar
          placeholder="Rechercher dans l'historique..."
          queryKey="hq"
          resultLabelSingular={fr.searchBar.resultLabelSingular}
          resultLabelPlural={fr.searchBar.resultLabelPlural}
          {...{ resultCount }}
        />
      </div>
      <CustomTable
        items={events}
        {...{ columns }}
        getItemId={(event) => String(event.id)}
        exportFilePrefix="historique"
        searchQueryKey="hq"
        pageQueryKey="hpage"
        sortQueryKey="hsort"
        defaultSort={[{ columnId: "date", dir: "desc" }]}
        onVisibleCountChange={setResultCount}
        labels={fr.table}
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
