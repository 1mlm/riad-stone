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
import { SearchBar } from "@/components/SearchBar";
import {
  buildRowSummary,
  CustomTable,
  type CustomTableColumn,
} from "@/components/table/CustomTable";
import { DeleteRowMenuItem } from "@/components/table/DeleteRowMenuItem";
import { CopyRowMenuItem } from "@/components/table/RowContextMenu";
import { useOptimisticRowRemoval } from "@/components/table/useOptimisticRowRemoval";
import { fr } from "@/messages/fr";
import { ContextMenuSeparator } from "@/shadcn/ui/context-menu";
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
  const { visibleItems, markRemoved, unmarkRemoved, deleteSelected } =
    useOptimisticRowRemoval(items, (item) => item.id);

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
        getButtons: (row, selectItem) => (
          <>
            <EditSortieDialog sortie={row} {...{ availableEntrees }} />
            {selectItem}
            <CopyRowMenuItem
              value={buildRowSummary(columns, row, fr.common.locale)}
              label="Copier"
              copiedLabel="Copié"
            />
            <ContextMenuSeparator />
            <DeleteRowMenuItem
              label="Supprimer"
              message={`Sortie de l'entrée ${row.entreeReference} supprimée`}
              undoLabel={fr.common.cancel}
              onOptimisticRemove={() => markRemoved(row.id)}
              onRevert={() => unmarkRemoved(row.id)}
              commit={() => deleteSortie(row.id)}
            />
          </>
        ),
      },
    ],
    [availableEntrees, markRemoved, unmarkRemoved],
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
        onDeleteSelected={(rows) =>
          deleteSelected(rows, (row) => deleteSortie(row.id))
        }
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
