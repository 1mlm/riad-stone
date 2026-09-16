"use client";

import { Icon } from "@/components/Icon";
import { ICONS } from "@/utils/icon";
import { ImportPreviewRow } from "./ImportPreviewRow";
import type { ParsedEntreeRow } from "./types";
import { countReferences, getRowFieldErrors } from "./validateImportRow";

const COLUMN_HEADERS = [
  "Référence",
  "Désignation",
  "Longueur",
  "Largeur",
  "Pièces",
  "Date",
  "Origine",
  "N° conteneur",
  "Commentaire",
  "",
];

export function ImportPreviewTable({
  rows,
  existingReferences,
  onRowsChange,
}: {
  rows: ParsedEntreeRow[];
  existingReferences: Set<string>;
  onRowsChange: (rows: ParsedEntreeRow[]) => void;
}) {
  const referenceCounts = countReferences(rows);

  if (rows.length === 0)
    return (
      <p className="flex items-center gap-1.5 py-6 text-center text-sm text-muted-foreground">
        <Icon icon={ICONS.notFound} />
        Plus aucune ligne à importer.
      </p>
    );

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full text-xs">
        <thead>
          <tr className="bg-muted/50">
            {COLUMN_HEADERS.map((header) => (
              <th
                key={header}
                className="p-1.5 text-left font-medium whitespace-nowrap text-muted-foreground"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <ImportPreviewRow
              key={row.id}
              {...{ row }}
              errors={getRowFieldErrors(
                row,
                referenceCounts,
                existingReferences,
              )}
              onChange={(next) =>
                onRowsChange(rows.map((r) => (r.id === row.id ? next : r)))
              }
              onDelete={() => onRowsChange(rows.filter((r) => r.id !== row.id))}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
