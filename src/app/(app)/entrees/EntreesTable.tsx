"use client";

import { Delete02Icon } from "@hugeicons/core-free-icons";
import { Suspense, useMemo, useState } from "react";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { Icon } from "@/components/Icon";
import { SearchBar } from "@/components/SearchBar";
import {
  CustomTable,
  type CustomTableColumn,
} from "@/components/table/CustomTable";
import { Button } from "@/shadcn/ui/button";
import { ICONS } from "@/utils/icon";
import { AddEntreeDialog } from "./AddEntreeDialog";
import { deleteEntree } from "./actions";
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
} from "./columns";
import { EditEntreeDialog } from "./EditEntreeDialog";
import type { EntreeRow } from "./types";

const DEFAULT_SORT = [
  { columnId: "designation", dir: "asc" as const },
  { columnId: "reference", dir: "desc" as const },
];

function DeleteButton({ reference }: { reference: string }) {
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
      title="Supprimer cette entrée ?"
      content={`L'entrée ${reference} sera supprimée définitivement. Cette action est irréversible.`}
      confirmLabel="Supprimer"
      confirmIcon={Delete02Icon}
      onConfirm={() => deleteEntree(reference)}
    />
  );
}

function EntreesTableContent({
  items,
  designationSuggestions,
}: {
  items: EntreeRow[];
  designationSuggestions: string[];
}) {
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
      createNombrePiecesColumn(),
      createSurfaceTotaleColumn(),
      createSurfaceDesignationColumn(items),
      {
        id: "actions",
        label: "Actions",
        icon: ICONS.actions,
        type: "buttons",
        getButtons: (row) => (
          <div className="flex items-center justify-center gap-1">
            <EditEntreeDialog entree={row} />
            <DeleteButton reference={row.reference} />
          </div>
        ),
      },
    ],
    [items],
  );

  return (
    <div className="flex min-w-0 flex-col gap-4 p-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <SearchBar
          className="flex-1"
          placeholder="Rechercher une entrée..."
          trailing={`${resultCount} ${resultCount === 1 ? "résultat" : "résultats"}`}
        />
        <AddEntreeDialog {...{ designationSuggestions }} />
      </div>
      <CustomTable
        {...{ items, columns }}
        getItemId={(row) => row.reference}
        exportFilePrefix="entrees"
        selectable
        defaultSort={DEFAULT_SORT}
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
