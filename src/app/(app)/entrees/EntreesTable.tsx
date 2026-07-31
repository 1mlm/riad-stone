"use client";

import { Suspense, useMemo, useState } from "react";
import { DeleteRowButton } from "@/components/DeleteRowButton";
import { SearchBar } from "@/components/SearchBar";
import {
  buildRowSummary,
  CustomTable,
  type CustomTableColumn,
} from "@/components/table/CustomTable";
import { CopyButton } from "@/components/table/CustomTableCell";
import { ICONS } from "@/utils/icon";
import { AddEntreeDialog } from "./AddEntreeDialog";
import { deleteEntree } from "./actions";
import {
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
}: {
  items: EntreeRow[];
  designationSuggestions: string[];
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
        getButtons: (row) => (
          <div className="flex items-center justify-center gap-1">
            <CopyButton
              value={buildRowSummary(columns, row)}
              variant="outline"
              size="icon-sm"
              className="corner-squircle"
            />
            <EditEntreeDialog entree={row} />
            <DeleteRowButton
              title="Supprimer cette entrée ?"
              content={`L'entrée ${row.reference} sera supprimée définitivement. Cette action est irréversible.`}
              onConfirm={async () => {
                setPendingRemovedRefs((prev) =>
                  new Set(prev).add(row.reference),
                );
                const result = await deleteEntree(row.reference);
                if (result.error)
                  setPendingRemovedRefs((prev) => {
                    const next = new Set(prev);
                    next.delete(row.reference);
                    return next;
                  });
                return result;
              }}
            />
          </div>
        ),
      },
    ],
    [visibleItems],
  );

  return (
    <div className="flex min-w-0 flex-col gap-4 p-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <SearchBar
          className="flex-1"
          placeholder="Rechercher une entrée..."
          {...{ resultCount }}
        />
        <AddEntreeDialog {...{ designationSuggestions }} />
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
      />
    </div>
  );
}

export function EntreesTable(props: {
  items: EntreeRow[];
  designationSuggestions: string[];
}) {
  return (
    <Suspense>
      <EntreesTableContent {...props} />
    </Suspense>
  );
}
