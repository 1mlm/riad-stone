"use client";

import { useState } from "react";
import { Icon } from "@/components/Icon";
import { getSortIcon } from "@/components/table/getSortIcon";
import { Button } from "@/shadcn/ui/button";
import { Checkbox } from "@/shadcn/ui/checkbox";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/shadcn/ui/input-group";
import { ICONS } from "@/utils/icon";
import { ImportPreviewRow } from "./ImportPreviewRow";
import {
  filterRows,
  PREVIEW_COLUMNS,
  type PreviewSort,
  sortRows,
} from "./previewTableColumns";
import type { ParsedEntreeRow } from "./types";
import { countReferences, getRowFieldErrors } from "./validateImportRow";

export function ImportPreviewTable({
  rows,
  existingReferences,
  selectedIds,
  onSelectedIdsChange,
  onRowsChange,
  onImportSelected,
  importSelectedPending,
}: {
  rows: ParsedEntreeRow[];
  existingReferences: Set<string>;
  selectedIds: Set<string>;
  onSelectedIdsChange: (ids: Set<string>) => void;
  onRowsChange: (rows: ParsedEntreeRow[]) => void;
  // undefined while a plain "delete this row" is all that's needed (no
  // server call) — only defined once there's a real selection to import
  onImportSelected?: () => void;
  importSelectedPending: boolean;
}) {
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<PreviewSort>(null);

  // validity is computed over every row regardless of the search box —
  // filtering only changes what's on screen, never what's allowed to import
  const referenceCounts = countReferences(rows);
  const selectedRowsHaveErrors = rows.some(
    (row) =>
      selectedIds.has(row.id) &&
      getRowFieldErrors(row, referenceCounts, existingReferences).size > 0,
  );

  const visibleRows = sortRows(filterRows(rows, search), sort);
  const visibleIds = new Set(visibleRows.map((row) => row.id));
  const selectedVisibleCount = visibleRows.filter((row) =>
    selectedIds.has(row.id),
  ).length;

  const toggleRowSelected = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onSelectedIdsChange(next);
  };

  const toggleSelectAllVisible = () => {
    const next = new Set(selectedIds);
    if (selectedVisibleCount === visibleRows.length)
      for (const id of visibleIds) next.delete(id);
    else for (const id of visibleIds) next.add(id);
    onSelectedIdsChange(next);
  };

  const deleteRows = (ids: Set<string>) => {
    onRowsChange(rows.filter((row) => !ids.has(row.id)));
    const next = new Set(selectedIds);
    for (const id of ids) next.delete(id);
    onSelectedIdsChange(next);
  };

  const toggleSort = (column: (typeof PREVIEW_COLUMNS)[number]["key"]) => {
    setSort((prev) => {
      if (prev?.column !== column) return { column, dir: "asc" };
      if (prev.dir === "asc") return { column, dir: "desc" };
      return null;
    });
  };

  if (rows.length === 0)
    return (
      <p className="flex items-center gap-1.5 py-6 text-center text-sm text-muted-foreground">
        <Icon icon={ICONS.notFound} />
        Plus aucune ligne à importer.
      </p>
    );

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <InputGroup className="max-w-64 corner-squircle">
          <InputGroupAddon>
            <Icon icon={ICONS.filter} />
          </InputGroupAddon>
          <InputGroupInput
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Filtrer les lignes..."
          />
        </InputGroup>
        {selectedIds.size > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
            <span>
              {selectedIds.size} sélectionnée{selectedIds.size > 1 ? "s" : ""}
            </span>
            {onImportSelected && (
              <Button
                type="button"
                size="sm"
                variant="secondary"
                disabled={importSelectedPending || selectedRowsHaveErrors}
                title={
                  selectedRowsHaveErrors
                    ? "Corrigez les lignes sélectionnées en rouge avant de les importer"
                    : undefined
                }
                onClick={onImportSelected}
              >
                <Icon icon={ICONS.check} />
                Importer la sélection
              </Button>
            )}
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="text-destructive hover:text-destructive"
              onClick={() => deleteRows(new Set(selectedIds))}
            >
              <Icon icon={ICONS.delete} />
              Supprimer la sélection
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => onSelectedIdsChange(new Set())}
            >
              Désélectionner
            </Button>
          </div>
        )}
      </div>

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-muted/50">
              <th className="p-1.5 text-center">
                <Checkbox
                  checked={
                    visibleRows.length > 0 &&
                    selectedVisibleCount === visibleRows.length
                      ? true
                      : selectedVisibleCount > 0
                        ? "indeterminate"
                        : false
                  }
                  onCheckedChange={toggleSelectAllVisible}
                  aria-label="Tout sélectionner"
                />
              </th>
              {PREVIEW_COLUMNS.map(({ key, label, icon, numeric }) => (
                <th
                  key={key}
                  className="p-1.5 text-left font-medium whitespace-nowrap text-muted-foreground"
                >
                  <button
                    type="button"
                    onClick={() => toggleSort(key)}
                    className="inline-flex cursor-pointer items-center gap-1.5 hover:text-foreground"
                  >
                    <Icon icon={icon} />
                    {label}
                    {sort?.column === key && (
                      <Icon
                        icon={getSortIcon(sort.dir, numeric)}
                        className="size-3 text-primary"
                      />
                    )}
                  </button>
                </th>
              ))}
              <th className="p-1.5" />
            </tr>
          </thead>
          <tbody>
            {visibleRows.length === 0 && (
              <tr>
                <td
                  colSpan={PREVIEW_COLUMNS.length + 2}
                  className="py-6 text-center text-muted-foreground"
                >
                  Aucune ligne ne correspond à « {search} ».
                </td>
              </tr>
            )}
            {visibleRows.map((row) => (
              <ImportPreviewRow
                key={row.id}
                {...{ row }}
                errors={getRowFieldErrors(
                  row,
                  referenceCounts,
                  existingReferences,
                )}
                selected={selectedIds.has(row.id)}
                onToggleSelected={() => toggleRowSelected(row.id)}
                onChange={(next) =>
                  onRowsChange(rows.map((r) => (r.id === row.id ? next : r)))
                }
                onDelete={() => deleteRows(new Set([row.id]))}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
