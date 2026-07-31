"use client";

import { Suspense, useMemo, useState } from "react";
import type { EntreeRow } from "@/app/(app)/entrees/types";
import { EntreeDetailsDialog } from "@/components/EntreeDetailsDialog";
import { ReferenceHistoryDialog } from "@/components/ReferenceHistoryDialog";
import { SearchBar } from "@/components/SearchBar";
import {
  CustomTable,
  type CustomTableColumn,
} from "@/components/table/CustomTable";
import { ICONS } from "@/utils/icon";
import {
  createDesignationColumn,
  createLargeurColumn,
  createLongueurColumn,
  createNombrePiecesColumn,
  createOrigineColumn,
  createReferenceColumn,
  createSurfaceDesignationColumn,
  createSurfacePieceColumn,
  createSurfaceTotaleColumn,
} from "../entrees/columns";

const DEFAULT_SORT = [
  { columnId: "designation", dir: "asc" as const },
  { columnId: "reference", dir: "desc" as const },
];

function StockTableContent({ items }: { items: EntreeRow[] }) {
  const [resultCount, setResultCount] = useState(items.length);

  const columns: CustomTableColumn<EntreeRow>[] = useMemo(
    () => [
      createDesignationColumn(),
      createReferenceColumn((row) => row.reference),
      {
        id: "date",
        label: "Date",
        icon: ICONS.date,
        type: "date",
        getDate: (row) => row.date,
      },
      createOrigineColumn(),
      createLongueurColumn(),
      createLargeurColumn(),
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
          <div className="flex items-center justify-center gap-1">
            <ReferenceHistoryDialog reference={row.reference} />
            <EntreeDetailsDialog reference={row.reference} />
          </div>
        ),
      },
    ],
    [items],
  );

  return (
    <div className="flex min-w-0 flex-col gap-4 p-5">
      <SearchBar
        placeholder="Rechercher dans le stock..."
        trailing={`${resultCount} ${resultCount === 1 ? "résultat" : "résultats"}`}
      />
      <CustomTable
        {...{ items, columns }}
        getItemId={(row) => row.reference}
        exportFilePrefix="stock"
        selectable
        defaultSort={DEFAULT_SORT}
        onVisibleCountChange={setResultCount}
      />
    </div>
  );
}

export function StockTable({ items }: { items: EntreeRow[] }) {
  return (
    <Suspense>
      <StockTableContent items={items} />
    </Suspense>
  );
}
