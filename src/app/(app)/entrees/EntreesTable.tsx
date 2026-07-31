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
      createSurfaceDesignationColumn(items),
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
              onConfirm={() => deleteEntree(row.reference)}
            />
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
          {...{ resultCount }}
        />
        <AddEntreeDialog {...{ designationSuggestions }} />
      </div>
      <CustomTable
        {...{ items, columns }}
        getItemId={(row) => row.reference}
        exportFilePrefix="entrees"
        selectable
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
