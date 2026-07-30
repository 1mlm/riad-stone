"use client";

import {
  Calendar04Icon,
  Cursor02Icon,
  Delete02Icon,
} from "@hugeicons/core-free-icons";
import { Suspense, useState, useTransition } from "react";
import { Icon } from "@/components/Icon";
import { SearchBar } from "@/components/SearchBar";
import {
  CustomTable,
  type CustomTableColumn,
} from "@/components/table/CustomTable";
import { Button } from "@/shadcn/ui/button";
import { AddEntreeDialog } from "./AddEntreeDialog";
import { deleteEntree } from "./actions";
import {
  createDesignationColumn,
  createLargeurColumn,
  createLongueurColumn,
  createNombrePiecesColumn,
  createOrigineColumn,
  createReferenceColumn,
  createSurfacePieceColumn,
  createSurfaceTotaleColumn,
} from "./columns";
import { EditEntreeDialog } from "./EditEntreeDialog";
import type { EntreeRow } from "./types";

function DeleteButton({ reference }: { reference: string }) {
  const [pending, startTransition] = useTransition();

  const handleDelete = () =>
    startTransition(async () => {
      const result = await deleteEntree(reference);
      if (result.error) alert(result.error);
    });

  return (
    <Button
      variant="destructive"
      size="icon-sm"
      className="corner-squircle"
      disabled={pending}
      onClick={handleDelete}
    >
      <Icon icon={Delete02Icon} />
    </Button>
  );
}

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
  {
    id: "actions",
    label: "Actions",
    icon: Cursor02Icon,
    type: "buttons",
    getButtons: (row) => (
      <div className="flex items-center justify-center gap-1">
        <EditEntreeDialog entree={row} />
        <DeleteButton reference={row.reference} />
      </div>
    ),
  },
];

function EntreesTableContent({
  items,
  designationSuggestions,
}: {
  items: EntreeRow[];
  designationSuggestions: string[];
}) {
  const [resultCount, setResultCount] = useState(items.length);

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
        emptyLabel="entrées"
        exportFilePrefix="entrees"
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
