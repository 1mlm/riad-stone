"use client";

import { Calendar04Icon } from "@hugeicons/core-free-icons";
import { Suspense, useState } from "react";
import type { EntreeRow } from "@/app/(app)/entrees/types";
import { SearchBar } from "@/components/SearchBar";
import {
  CustomTable,
  type CustomTableColumn,
} from "@/components/table/CustomTable";
import {
  createDesignationColumn,
  createLargeurColumn,
  createLongueurColumn,
  createNombrePiecesColumn,
  createOrigineColumn,
  createReferenceColumn,
  createSurfacePieceColumn,
  createSurfaceTotaleColumn,
} from "../entrees/columns";

const columns: CustomTableColumn<EntreeRow>[] = [
  createReferenceColumn((row) => row.reference),
  createDesignationColumn(),
  {
    id: "date",
    label: "Date",
    icon: Calendar04Icon,
    type: "date",
    getDate: (row) => row.date,
  },
  createOrigineColumn(),
  createLongueurColumn(),
  createLargeurColumn(),
  createSurfacePieceColumn(),
  createNombrePiecesColumn(),
  createSurfaceTotaleColumn(),
];

function StockTableContent({ items }: { items: EntreeRow[] }) {
  const [resultCount, setResultCount] = useState(items.length);

  return (
    <div className="flex min-w-0 flex-col gap-4 p-5">
      <SearchBar
        placeholder="Rechercher dans le stock..."
        trailing={`${resultCount} ${resultCount === 1 ? "résultat" : "résultats"}`}
      />
      <CustomTable
        {...{ items, columns }}
        getItemId={(row) => row.reference}
        emptyLabel="stock"
        exportFilePrefix="stock"
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
