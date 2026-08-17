"use client";

import { ExpandIcon } from "@hugeicons/core-free-icons";
import { Suspense, useMemo, useState } from "react";
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
} from "@/app/(app)/entrees/columns";
import type { EntreeRow } from "@/app/(app)/entrees/types";
import { EntreeDetailsDialog } from "@/components/EntreeDetailsDialog";
import { SearchBar } from "@/components/SearchBar";
import {
  buildRowSummary,
  CustomTable,
  type CustomTableColumn,
} from "@/components/table/CustomTable";
import {
  CopyRowMenuItem,
  RowMenuItemButton,
} from "@/components/table/RowContextMenu";
import { fr } from "@/messages/fr";
import { ICONS } from "@/utils/icon";

function StockTableContent({ items }: { items: EntreeRow[] }) {
  const [resultCount, setResultCount] = useState(items.length);

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
      createNombrePiecesColumn("Pièces restantes"),
      createSurfaceTotaleColumn(),
      createSurfaceDesignationColumn(items),
      {
        id: "actions",
        label: "Actions",
        icon: ICONS.actions,
        type: "buttons",
        getButtons: (row) => (
          <>
            <CopyRowMenuItem
              value={buildRowSummary(columns, row, fr.common.locale)}
              label="Copier"
              toastMessage="Copié dans le presse-papier"
            />
            <EntreeDetailsDialog
              reference={row.reference}
              trigger={
                <RowMenuItemButton icon={ExpandIcon}>Détails</RowMenuItemButton>
              }
            />
          </>
        ),
      },
    ],
    [items],
  );

  return (
    <div className="flex min-w-0 flex-col gap-4 p-5">
      <div className="sticky top-20 z-10 bg-background py-1 sm:top-0">
        <SearchBar
          placeholder="Rechercher dans le stock..."
          resultLabelSingular={fr.searchBar.resultLabelSingular}
          resultLabelPlural={fr.searchBar.resultLabelPlural}
          {...{ resultCount }}
        />
      </div>
      <CustomTable
        {...{ items, columns }}
        getItemId={(row) => row.reference}
        exportFilePrefix="stock"
        selectable
        defaultSort={DESIGNATION_THEN_REFERENCE_SORT}
        onVisibleCountChange={setResultCount}
        labels={fr.table}
      />
    </div>
  );
}

export function StockTable({ items }: { items: EntreeRow[] }) {
  return (
    <Suspense>
      <StockTableContent {...{ items }} />
    </Suspense>
  );
}
