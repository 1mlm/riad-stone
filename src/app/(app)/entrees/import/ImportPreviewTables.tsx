"use client";

import { Icon } from "@/components/Icon";
import { CustomTable } from "@/components/table/CustomTable";
import { UnitDropdown } from "@/components/UnitDropdown";
import { fr } from "@/messages/fr";
import { Button } from "@/shadcn/ui/button";
import { ICONS } from "@/utils/icon";
import type { LengthUnit } from "@/utils/length";
import { buildImportPreviewColumns } from "./previewColumns";
import type { ParsedEntreeRow } from "./types";
import { reinterpretLargeurUnit, reinterpretLongueurUnit } from "./units";
import { countReferences, getRowFieldErrors } from "./validateImportRow";

export const tableKey = (source: { sheet: string; tableIndex: number }) =>
  `${source.sheet}::${source.tableIndex}`;

export type ImportTableMeta = {
  key: string;
  sheet: string;
  tableIndex: number;
  longueurUnit: LengthUnit;
  largeurUnit: LengthUnit;
};

function UnitFixControl({
  label,
  unit,
  onUnitChange,
}: {
  label: string;
  unit: LengthUnit;
  onUnitChange: (unit: LengthUnit) => void;
}) {
  return (
    <div className="flex items-center gap-1 rounded-full corner-squircle border border-border px-2 py-0.5 text-xs text-muted-foreground">
      {label}
      <UnitDropdown {...{ unit, onUnitChange }} />
    </div>
  );
}

// one CustomTable per source table (sheet + table-in-sheet), so a multi-table
// workbook shows each lot as its own selectable block instead of one giant
// mixed list — each block gets its own "this column's unit was guessed
// wrong" control, since two tables in the same file can genuinely use
// different units (see parseWorkbook's inferredUnit comment)
export function ImportPreviewTables({
  tables,
  rows,
  onRowsChange,
  onTableUnitChange,
  existingReferences,
  onImportRows,
  importPending,
}: {
  tables: ImportTableMeta[];
  rows: ParsedEntreeRow[];
  onRowsChange: (rows: ParsedEntreeRow[]) => void;
  onTableUnitChange: (
    key: string,
    field: "longueur" | "largeur",
    unit: LengthUnit,
  ) => void;
  existingReferences: Set<string>;
  onImportRows: (rows: ParsedEntreeRow[]) => Promise<void>;
  importPending: boolean;
}) {
  // duplicate-reference detection has to see every table at once — a
  // reference reused across two different source tables is still a
  // duplicate, even though each table renders as its own CustomTable
  const referenceCounts = countReferences(rows);
  const getRowErrors = (row: ParsedEntreeRow) =>
    getRowFieldErrors(row, referenceCounts, existingReferences);

  const updateRow = (rowId: string, patch: Partial<ParsedEntreeRow>) =>
    onRowsChange(
      rows.map((row) => (row.id === rowId ? { ...row, ...patch } : row)),
    );
  const deleteRow = (rowId: string) =>
    onRowsChange(rows.filter((row) => row.id !== rowId));

  const columns = buildImportPreviewColumns({
    updateRow,
    deleteRow,
    getRowErrors,
  });

  return (
    <div className="flex flex-col gap-6">
      {tables.map((table) => {
        const tableRows = rows.filter(
          (row) => tableKey(row.source) === table.key,
        );
        if (tableRows.length === 0) return null;

        return (
          <div key={table.key} className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2">
              {tables.length > 1 && (
                <span className="text-xs font-medium text-muted-foreground">
                  {table.sheet}
                  {tables.filter((t) => t.sheet === table.sheet).length > 1 &&
                    ` — tableau ${table.tableIndex + 1}`}
                  {" · "}
                  {tableRows.length} ligne{tableRows.length > 1 ? "s" : ""}
                </span>
              )}
              <div className="ml-auto flex flex-wrap items-center gap-1.5">
                <UnitFixControl
                  label="Longueur"
                  unit={table.longueurUnit}
                  onUnitChange={(unit) =>
                    onTableUnitChange(table.key, "longueur", unit)
                  }
                />
                <UnitFixControl
                  label="Largeur"
                  unit={table.largeurUnit}
                  onUnitChange={(unit) =>
                    onTableUnitChange(table.key, "largeur", unit)
                  }
                />
              </div>
            </div>

            <CustomTable
              items={tableRows}
              {...{ columns }}
              getItemId={(row) => row.id}
              syncToUrl={false}
              selectable
              actionBarPlacement="inline"
              paginate={false}
              labels={{
                ...fr.table,
                search: "Filtrer les lignes...",
                emptyTitle: "Aucune ligne",
              }}
              selectionActions={(selected) => {
                const hasErrors = selected.some(
                  (row) => getRowErrors(row).size > 0,
                );
                return (
                  <>
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      className="shadow-lg"
                      disabled={importPending || hasErrors}
                      title={
                        hasErrors
                          ? "Corrigez les lignes sélectionnées en rouge avant de les importer"
                          : undefined
                      }
                      onClick={() => onImportRows(selected)}
                    >
                      <Icon icon={ICONS.check} />
                      Importer la sélection
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="shadow-lg text-destructive hover:text-destructive"
                      onClick={() => {
                        const ids = new Set(selected.map((row) => row.id));
                        onRowsChange(rows.filter((row) => !ids.has(row.id)));
                      }}
                    >
                      <Icon icon={ICONS.delete} />
                      Supprimer la sélection
                    </Button>
                  </>
                );
              }}
            />
          </div>
        );
      })}
    </div>
  );
}

export function reinterpretTableUnit(
  rows: ParsedEntreeRow[],
  table: ImportTableMeta,
  field: "longueur" | "largeur",
  unit: LengthUnit,
): ParsedEntreeRow[] {
  const inThisTable = (row: ParsedEntreeRow) =>
    tableKey(row.source) === table.key;
  const reinterpret =
    field === "longueur" ? reinterpretLongueurUnit : reinterpretLargeurUnit;
  const updated = new Map(
    reinterpret(rows.filter(inThisTable), unit).map((row) => [row.id, row]),
  );
  return rows.map((row) => updated.get(row.id) ?? row);
}
