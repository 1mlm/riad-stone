"use client";

import { ExpandIcon, Share03Icon } from "@hugeicons/core-free-icons";
import { Suspense, useState } from "react";
import { MetaPage } from "@/components/MetaPage";
import { SearchBar } from "@/components/SearchBar";
import {
  buildRowSummary,
  CustomTable,
  type CustomTableColumn,
} from "@/components/table/CustomTable";
import { CopyMenuItem, RowMenuItemButton } from "@/components/table/RowMenu";
import type { HistoryEvent } from "@/generated/prisma/client";
import { fr } from "@/messages/fr";
import { Popover, PopoverContent, PopoverTrigger } from "@/shadcn/ui/popover";
import { getEventReference, getEventSnapshots } from "@/utils/historySnapshot";
import { ICONS } from "@/utils/icon";
import { buildShareLink } from "@/utils/shareLink";
import { HistoryDataTable } from "./HistoryDataTable";
import { getDisplayFields } from "./historyFieldMeta";
import { TYPE_META } from "./historyTypeMeta";

// a batch created in one submit is stored as one event per row, so each lot
// keeps its own creation row in its own timeline — but it was one action and
// reads as noise listed N times here. logHistoryBatch gives every row of a
// batch the same exact createdAt, which is what identifies them as one
type HistoryRow = HistoryEvent & { batch: HistoryEvent[] };

// every reference the row covers — more than one only for a grouped batch
function getRowReferences(row: HistoryRow): string[] {
  return row.batch
    .map((event) => getEventReference(event.type, event.data))
    .filter((reference) => reference !== undefined);
}

function groupBatchedEvents(events: HistoryEvent[]): HistoryRow[] {
  const rowsByBatch = new Map<string, HistoryRow>();
  for (const event of events) {
    const key = `${event.type}-${event.createdAt.getTime()}`;
    const row = rowsByBatch.get(key);
    if (row) row.batch.push(event);
    else rowsByBatch.set(key, { ...event, batch: [event] });
  }
  return [...rowsByBatch.values()];
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
  const rows = groupBatchedEvents(events);
  const [resultCount, setResultCount] = useState(rows.length);

  if (events.length === 0)
    return (
      <MetaPage
        icon={ICONS.history}
        title={emptyTitle}
        subtitle={emptySubtitle}
      />
    );

  const columns: CustomTableColumn<HistoryRow>[] = [
    {
      id: "actions",
      label: "Actions",
      icon: ICONS.actions,
      type: "buttons",
      getButtons: (event, selectItem) => {
        const { before } = getEventSnapshots(event.type, event.data);
        const entries = event.batch.map((batched) => ({
          id: batched.id,
          snapshot: getEventSnapshots(batched.type, batched.data).current,
        }));
        const hasDetails =
          getDisplayFields(
            Object.assign({}, ...entries.map((entry) => entry.snapshot)),
            before,
          ).length > 0;
        const references = getRowReferences(event);
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
                  <HistoryDataTable {...{ entries, before }} />
                </PopoverContent>
              </Popover>
            )}
            {selectItem}
            <CopyMenuItem
              value={buildRowSummary(columns, event, fr.common.locale)}
              label="Copier"
              copiedLabel="Copié"
            />
            {references.length === 1 && (
              <CopyMenuItem
                icon={Share03Icon}
                value={buildShareLink("/historique", "hq", references[0])}
                label="Partager"
                copiedLabel="Lien copié"
              />
            )}
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
      getString: (event) => getRowReferences(event).join(", "),
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
        items={rows}
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
