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
import { useSearchQueryLogging } from "@/components/useSearchQueryLogging";
import type { HistoryEvent } from "@/generated/prisma/client";
import { fr } from "@/messages/fr";
import { Popover, PopoverContent, PopoverTrigger } from "@/shadcn/ui/popover";
import { getEventReference, getEventSnapshots } from "@/utils/historySnapshot";
import { ICONS } from "@/utils/icon";
import { buildShareLink } from "@/utils/shareLink";
import { HistoryDataTable } from "./HistoryDataTable";
import { getDisplayFields } from "./historyFieldMeta";
import { TYPE_META } from "./historyTypeMeta";

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
  useSearchQueryLogging("hq");

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
        const reference = getEventReference(event.type, event.data);
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
            <CopyMenuItem
              value={buildRowSummary(columns, event, fr.common.locale)}
              label="Copier"
              copiedLabel="Copié"
            />
            {reference && (
              <CopyMenuItem
                icon={Share03Icon}
                value={buildShareLink("/historique", "hq", reference)}
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
