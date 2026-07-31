"use client";

import { Delete02Icon } from "@hugeicons/core-free-icons";
import { Suspense, useState } from "react";
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
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { Icon } from "@/components/Icon";
import { SearchBar } from "@/components/SearchBar";
import {
  CustomTable,
  type CustomTableColumn,
} from "@/components/table/CustomTable";
import { Button } from "@/shadcn/ui/button";
import { ICONS } from "@/utils/icon";
import { AddSortieDialog } from "./AddSortieDialog";
import { deleteSortie } from "./actions";
import { EditSortieDialog } from "./EditSortieDialog";
import type { AvailableEntree, SortieRow } from "./types";

function DeleteButton({
  id,
  entreeReference,
}: {
  id: number;
  entreeReference: string;
}) {
  return (
    <ConfirmDialog
      trigger={
        <Button
          variant="destructive"
          size="icon-sm"
          className="corner-squircle"
        >
          <Icon icon={Delete02Icon} />
        </Button>
      }
      title="Supprimer cette sortie ?"
      content={`La sortie de l'entrée ${entreeReference} sera supprimée définitivement. Cette action est irréversible.`}
      confirmLabel="Supprimer"
      confirmIcon={Delete02Icon}
      onConfirm={() => deleteSortie(id)}
    />
  );
}

const columns: CustomTableColumn<SortieRow>[] = [
  createReferenceColumn((row) => row.entreeReference),
  createDesignationColumn(),
  {
    id: "bonCommande",
    label: "Bon de commande",
    icon: ICONS.bonCommande,
    type: "string",
    getString: (row) => row.bonCommande ?? "",
  },
  {
    id: "dateSortie",
    label: "Date de sortie",
    icon: ICONS.date,
    type: "date",
    getDate: (row) => row.dateSortie,
  },
  {
    id: "dateEntree",
    label: "Date d'entrée",
    icon: ICONS.date,
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
    icon: ICONS.actions,
    type: "buttons",
    getButtons: (row) => (
      <div className="flex items-center justify-center gap-1">
        <EditSortieDialog sortie={row} />
        <DeleteButton id={row.id} entreeReference={row.entreeReference} />
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
        getItemId={(row) => String(row.id)}
        exportFilePrefix="sorties"
        selectable
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
