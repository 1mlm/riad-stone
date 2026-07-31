"use client";

import { Suspense, useState } from "react";
import {
  createDesignationColumn,
  createLengthColumn,
  createNombrePiecesColumn,
  createOrigineColumn,
  createReferenceColumn,
  createSurfacePieceColumn,
  createSurfaceTotaleColumn,
} from "@/app/(app)/entrees/columns";
import { DeleteRowButton } from "@/components/DeleteRowButton";
import { SearchBar } from "@/components/SearchBar";
import {
  buildRowSummary,
  CustomTable,
  type CustomTableColumn,
} from "@/components/table/CustomTable";
import { CopyButton } from "@/components/table/CustomTableCell";
import { ICONS } from "@/utils/icon";
import { AddSortieDialog } from "./AddSortieDialog";
import { deleteSortie } from "./actions";
import { EditSortieDialog } from "./EditSortieDialog";
import type { AvailableEntree, SortieRow } from "./types";

const columns: CustomTableColumn<SortieRow>[] = [
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
          value={buildRowSummary(columns, row)}
          variant="outline"
          size="icon-sm"
          className="corner-squircle"
        />
        <EditSortieDialog sortie={row} />
        <DeleteRowButton
          title="Supprimer cette sortie ?"
          content={`La sortie de l'entrée ${row.entreeReference} sera supprimée définitivement. Cette action est irréversible.`}
          onConfirm={() => deleteSortie(row.id)}
        />
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
          {...{ resultCount }}
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
