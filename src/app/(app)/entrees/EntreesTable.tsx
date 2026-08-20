"use client";

import { Share03Icon } from "@hugeicons/core-free-icons";
import { Suspense, useMemo, useState } from "react";
import { SearchBar } from "@/components/SearchBar";
import {
  buildRowSummary,
  CustomTable,
  type CustomTableColumn,
} from "@/components/table/CustomTable";
import { DeleteRowMenuItem } from "@/components/table/DeleteRowMenuItem";
import { CopyMenuItem } from "@/components/table/RowMenu";
import { useJustCreatedIds } from "@/components/table/useJustCreatedIds";
import { useOptimisticRowRemoval } from "@/components/table/useOptimisticRowRemoval";
import { fr } from "@/messages/fr";
import { DropdownMenuSeparator } from "@/shadcn/ui/dropdown-menu";
import { ICONS } from "@/utils/icon";
import { buildShareLink } from "@/utils/shareLink";
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
  const { visibleItems, markRemoved, unmarkRemoved, deleteSelected } =
    useOptimisticRowRemoval(items, (item) => item.reference);
  const pinnedItemIds = useJustCreatedIds(items, (item) => item.reference);

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
            <CopyMenuItem
              value={buildRowSummary(columns, row, fr.common.locale)}
              label="Copier"
              copiedLabel="Copié"
            />
            <CopyMenuItem
              icon={Share03Icon}
              value={buildShareLink("/entrees", "q", row.reference)}
              label="Partager"
              copiedLabel="Lien copié"
            />
            <DropdownMenuSeparator />
            <DeleteRowMenuItem
              label="Supprimer"
              message={`Entrée ${row.reference} supprimée`}
              undoLabel={fr.common.cancel}
              onOptimisticRemove={() => markRemoved(row.reference)}
              onRevert={() => unmarkRemoved(row.reference)}
              commit={() => deleteEntree(row.reference)}
            />
          </>
        ),
      },
    ],
    [visibleItems, markRemoved, unmarkRemoved],
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
        onDeleteSelected={(rows) =>
          deleteSelected(rows, (row) => deleteEntree(row.reference))
        }
        defaultSort={DESIGNATION_THEN_REFERENCE_SORT}
        onVisibleCountChange={setResultCount}
        {...{ pinnedItemIds }}
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
