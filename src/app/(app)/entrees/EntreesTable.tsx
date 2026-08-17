"use client";

import { Suspense, useMemo, useState } from "react";
import { SearchBar } from "@/components/SearchBar";
import {
  buildRowSummary,
  CustomTable,
  type CustomTableColumn,
} from "@/components/table/CustomTable";
import { DeleteRowMenuItem } from "@/components/table/DeleteRowMenuItem";
import { CopyRowMenuItem } from "@/components/table/RowContextMenu";
import { fr } from "@/messages/fr";
import { ContextMenuSeparator } from "@/shadcn/ui/context-menu";
import { ICONS } from "@/utils/icon";
import { AddEntreeDialog } from "./AddEntreeDialog";
import { deleteEntree } from "./actions";
import {
  createConteneurColumn,
  createDateColumn,
  createDesignationColumn,
  createLengthColumn,
  createNombrePiecesColumn,
  createOrigineColumn,
  createReferenceColumn,
  createSurfaceDesignationColumn,
  createSurfacePieceColumn,
  createSurfaceTotaleColumn,
  DESIGNATION_THEN_REFERENCE_SORT,
} from "./columns";
import { EditEntreeDialog } from "./EditEntreeDialog";
import type { EntreeRow } from "./types";

function EntreesTableContent({
  items,
  designationSuggestions,
  fieldSuggestions,
}: {
  items: EntreeRow[];
  designationSuggestions: string[];
  fieldSuggestions: { origine: string[]; conteneur: string[] };
}) {
  const [resultCount, setResultCount] = useState(items.length);
  // hides a row the moment its delete is confirmed, instead of waiting on
  // the server action's revalidatePath round-trip — rolled back on error
  const [pendingRemovedRefs, setPendingRemovedRefs] = useState<Set<string>>(
    new Set(),
  );
  const visibleItems = useMemo(
    () => items.filter((item) => !pendingRemovedRefs.has(item.reference)),
    [items, pendingRemovedRefs],
  );

  const columns: CustomTableColumn<EntreeRow>[] = useMemo(
    () => [
      createDesignationColumn(),
      createReferenceColumn((row) => row.reference),
      createDateColumn(),
      createOrigineColumn(),
      createConteneurColumn(),
      createLengthColumn("longueur"),
      createLengthColumn("largeur"),
      createSurfacePieceColumn(),
      createNombrePiecesColumn(),
      createSurfaceTotaleColumn(),
      createSurfaceDesignationColumn(visibleItems),
      {
        id: "actions",
        label: "Actions",
        icon: ICONS.actions,
        type: "buttons",
        getButtons: (row, selectItem) => (
          <>
            <EditEntreeDialog entree={row} />
            {selectItem}
            <CopyRowMenuItem
              value={buildRowSummary(columns, row, fr.common.locale)}
              label="Copier"
              copiedLabel="Copié"
            />
            <ContextMenuSeparator />
            <DeleteRowMenuItem
              label="Supprimer"
              message={`Entrée ${row.reference} supprimée`}
              undoLabel={fr.common.cancel}
              onOptimisticRemove={() =>
                setPendingRemovedRefs((prev) =>
                  new Set(prev).add(row.reference),
                )
              }
              onRevert={() =>
                setPendingRemovedRefs((prev) => {
                  const next = new Set(prev);
                  next.delete(row.reference);
                  return next;
                })
              }
              commit={() => deleteEntree(row.reference)}
            />
          </>
        ),
      },
    ],
    [visibleItems],
  );

  return (
    <div className="flex min-w-0 flex-col gap-4 p-5">
      <div className="sticky top-20 z-10 flex flex-col gap-2 bg-background py-1 sm:top-0 sm:flex-row sm:items-center">
        <SearchBar
          className="flex-1"
          placeholder="Rechercher une entrée..."
          resultLabelSingular={fr.searchBar.resultLabelSingular}
          resultLabelPlural={fr.searchBar.resultLabelPlural}
          {...{ resultCount }}
        />
        <AddEntreeDialog {...{ designationSuggestions, fieldSuggestions }} />
      </div>
      <CustomTable
        items={visibleItems}
        {...{ columns }}
        getItemId={(row) => row.reference}
        exportFilePrefix="entrees"
        selectable
        onDeleteSelected={async (rows) => {
          setPendingRemovedRefs(
            (prev) => new Set([...prev, ...rows.map((row) => row.reference)]),
          );
          const results = await Promise.all(
            rows.map((row) => deleteEntree(row.reference)),
          );
          const failedRefs = rows
            .filter((_, i) => results[i].error)
            .map((row) => row.reference);
          if (failedRefs.length > 0)
            setPendingRemovedRefs((prev) => {
              const next = new Set(prev);
              for (const ref of failedRefs) next.delete(ref);
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

export function EntreesTable(props: {
  items: EntreeRow[];
  designationSuggestions: string[];
  fieldSuggestions: { origine: string[]; conteneur: string[] };
}) {
  return (
    <Suspense>
      <EntreesTableContent {...props} />
    </Suspense>
  );
}
