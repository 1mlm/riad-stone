"use client";

import {
  Calendar04Icon,
  Cursor02Icon,
  Delete02Icon,
  InvoiceIcon,
} from "@hugeicons/core-free-icons";
import { Suspense, useState, useTransition } from "react";
import {
  createDesignationColumn,
  createLargeurColumn,
  createLongueurColumn,
  createNombrePiecesColumn,
  createOrigineColumn,
  createReferenceColumn,
  createSurfacePieceColumn,
  createSurfaceTotaleColumn,
} from "@/app/(app)/entrees/columns";
import { Icon } from "@/components/Icon";
import { SearchBar } from "@/components/SearchBar";
import {
  CustomTable,
  type CustomTableColumn,
} from "@/components/table/CustomTable";
import { Button } from "@/shadcn/ui/button";
import { AddSortieDialog } from "./AddSortieDialog";
import { deleteSortie } from "./actions";
import { EditSortieDialog } from "./EditSortieDialog";
import type { AvailableEntree, SortieRow } from "./types";

function DeleteButton({ entreeReference }: { entreeReference: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      variant="destructive"
      size="icon-sm"
      className="corner-squircle"
      disabled={pending}
      onClick={() => startTransition(() => deleteSortie(entreeReference))}
    >
      <Icon icon={Delete02Icon} />
    </Button>
  );
}

const columns: CustomTableColumn<SortieRow>[] = [
  createReferenceColumn((row) => row.entreeReference),
  createDesignationColumn(),
  {
    id: "bonCommande",
    label: "Bon de commande",
    icon: InvoiceIcon,
    type: "string",
    getString: (row) => row.bonCommande,
  },
  {
    id: "dateSortie",
    label: "Date de sortie",
    icon: Calendar04Icon,
    type: "date",
    getDate: (row) => row.dateSortie,
  },
  {
    id: "dateEntree",
    label: "Date d'entrée",
    icon: Calendar04Icon,
    type: "date",
    getDate: (row) => row.dateEntree,
  },
  createOrigineColumn(),
  createLongueurColumn(),
  createLargeurColumn(),
  createSurfacePieceColumn(),
  createNombrePiecesColumn(),
  createSurfaceTotaleColumn(),
  {
    id: "actions",
    label: "Actions",
    icon: Cursor02Icon,
    type: "buttons",
    getButtons: (row) => (
      <div className="flex items-center justify-center gap-1">
        <EditSortieDialog sortie={row} />
        <DeleteButton entreeReference={row.entreeReference} />
      </div>
    ),
  },
];

function SortiesTableContent({
  items,
  availableEntrees,
}: {
  items: SortieRow[];
  availableEntrees: AvailableEntree[];
}) {
  const [resultCount, setResultCount] = useState(items.length);

  return (
    <div className="flex min-w-0 flex-col gap-4 p-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <SearchBar
          className="flex-1"
          placeholder="Rechercher une sortie..."
          trailing={`${resultCount} ${resultCount === 1 ? "résultat" : "résultats"}`}
        />
        <AddSortieDialog {...{ availableEntrees }} />
      </div>
      <CustomTable
        {...{ items, columns }}
        getItemId={(row) => row.entreeReference}
        emptyLabel="sorties"
        exportFilePrefix="sorties"
        onVisibleCountChange={setResultCount}
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
