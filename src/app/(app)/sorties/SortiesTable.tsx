"use client";

import { Suspense, useMemo, useState } from "react";
import {
  createConteneurColumn,
  createDesignationColumn,
  createLengthColumn,
  createNombrePiecesColumn,
  createOrigineColumn,
  createReferenceColumn,
  createSurfacePieceColumn,
  createSurfaceTotaleColumn,
  DESIGNATION_THEN_REFERENCE_SORT,
} from "@/app/(app)/entrees/columns";
import { DeleteRowButton } from "@/components/DeleteRowButton";
import { SearchBar } from "@/components/SearchBar";
import {
  buildRowSummary,
  CustomTable,
  type CustomTableColumn,
} from "@/components/table/CustomTable";
import { CopyButton } from "@/components/table/CustomTableCell";
import { fr } from "@/messages/fr";
import { ICONS } from "@/utils/icon";
import { AddSortieDialog } from "./AddSortieDialog";
import { deleteSortie } from "./actions";
import { EditSortieDialog } from "./EditSortieDialog";
import type { AvailableEntree, SortieRow } from "./types";

function SortiesTableContent({
  items,
  availableEntrees,
}: {
  items: SortieRow[];
  availableEntrees: AvailableEntree[];
}) {
  const [resultCount, setResultCount] = useState(items.length);
  // hides a row the moment its delete is confirmed, instead of waiting on
  // the server action's revalidatePath round-trip — rolled back on error
  const [pendingRemovedIds, setPendingRemovedIds] = useState<Set<number>>(
    new Set(),
  );
  const visibleItems = useMemo(
    () => items.filter((item) => !pendingRemovedIds.has(item.id)),
    [items, pendingRemovedIds],
  );

  const columns: CustomTableColumn<SortieRow>[] = useMemo(
    () => [
      createReferenceColumn((row) => row.entreeReference),
      createDesignationColumn(),
      {
        id: "bonCommande",
        label: "Bon de commande",
        icon: ICONS.bonCommande,
        type: "string",
        monospace: true,
        getString: (row) => row.bonCommande ?? "",
      },
      {
        id: "dateSortie",
        label: "Date de sortie",
        icon: ICONS.date,
        type: "date",
        relative: false,
        getDate: (row) => row.dateSortie,
      },
      {
        id: "dateEntree",
        label: "Date d'entrée",
        icon: ICONS.date,
        type: "date",
        relative: false,
        getDate: (row) => row.dateEntree,
      },
      createOrigineColumn(),
      createConteneurColumn(),
      createLengthColumn("longueur"),
      createLengthColumn("largeur"),
      createSurfacePieceColumn(),
      createNombrePiecesColumn(),
      createSurfaceTotaleColumn(),
      {
        id: "actions",
        label: "Actions",
        icon: ICONS.actions,
        type: "buttons",
        getButtons: (row) => (
          <div className="flex items-center justify-center gap-1">
            <CopyButton
              value={buildRowSummary(columns, row, fr.common.locale)}
              variant="outline"
              size="icon-sm"
              className="corner-squircle"
            />
            <EditSortieDialog sortie={row} {...{ availableEntrees }} />
            <DeleteRowButton
              message={`Sortie de l'entrée ${row.entreeReference} supprimée`}
              undoLabel={fr.common.cancel}
              onOptimisticRemove={() =>
                setPendingRemovedIds((prev) => new Set(prev).add(row.id))
              }
              onRevert={() =>
                setPendingRemovedIds((prev) => {
                  const next = new Set(prev);
                  next.delete(row.id);
                  return next;
                })
              }
              commit={() => deleteSortie(row.id)}
            />
          </div>
        ),
      },
    ],
    [availableEntrees],
  );

  return (
    <div className="flex min-w-0 flex-col gap-4 p-5">
      <div className="sticky top-20 z-10 flex flex-col gap-2 bg-background py-1 sm:top-0 sm:flex-row sm:items-center">
        <SearchBar
          className="flex-1"
          placeholder="Rechercher une sortie..."
          resultLabelSingular={fr.searchBar.resultLabelSingular}
          resultLabelPlural={fr.searchBar.resultLabelPlural}
          {...{ resultCount }}
        />
        <AddSortieDialog {...{ availableEntrees }} />
      </div>
      <CustomTable
        items={visibleItems}
        {...{ columns }}
        getItemId={(row) => String(row.id)}
        exportFilePrefix="sorties"
        selectable
        onDeleteSelected={async (rows) => {
          setPendingRemovedIds(
            (prev) => new Set([...prev, ...rows.map((row) => row.id)]),
          );
          const results = await Promise.all(
            rows.map((row) => deleteSortie(row.id)),
          );
          const failedIds = rows
            .filter((_, i) => results[i].error)
            .map((row) => row.id);
          if (failedIds.length > 0)
            setPendingRemovedIds((prev) => {
              const next = new Set(prev);
              for (const id of failedIds) next.delete(id);
              return next;
            });
          return { error: results.find((r) => r.error)?.error ?? null };
        }}
        defaultSort={DESIGNATION_THEN_REFERENCE_SORT}
        onVisibleCountChange={setResultCount}
        labels={fr.table}
      />
    </div>
  );
}

export function SortiesTable(props: {
  items: SortieRow[];
  availableEntrees: AvailableEntree[];
}) {
  return (
    <Suspense>
      <SortiesTableContent {...props} />
    </Suspense>
  );
}
