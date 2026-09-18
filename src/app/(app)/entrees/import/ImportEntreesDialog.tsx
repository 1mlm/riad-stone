"use client";

import ExcelJS from "exceljs";
import { useRef, useState } from "react";
import { DialogTitleChip } from "@/components/DialogTitleChip";
import { FormError } from "@/components/FormError";
import { Icon } from "@/components/Icon";
import { SubmitButton } from "@/components/SubmitButton";
import { fr } from "@/messages/fr";
import { Button } from "@/shadcn/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shadcn/ui/dialog";
import { haptic } from "@/utils/haptics";
import { ICONS } from "@/utils/icon";
import type { LengthUnit } from "@/utils/length";
import { playChime } from "@/utils/sound";
import { getExistingReferences, importEntrees } from "../actions";
import {
  ImportPreviewTables,
  type ImportTableMeta,
  reinterpretTableUnit,
  tableKey,
} from "./ImportPreviewTables";
import { parseWorkbook } from "./parseWorkbook";
import type { ParsedEntreeRow } from "./types";
import { useWindowFileDrop } from "./useWindowFileDrop";
import { countReferences, getRowFieldErrors } from "./validateImportRow";

// no picker step, no template — clicking Importer (or dropping a file
// anywhere on the page) goes straight from file to this popup, already
// showing the rows it's about to add. Confirm or cancel from there
// same shape importEntrees expects, off a preview row that's already
// cleared validation (the null-coalescing defaults never actually apply at
// that point, they're just satisfying the type)
function buildImportInput(row: ParsedEntreeRow) {
  return {
    designation: row.designation ?? "",
    reference: row.reference ?? "",
    origine: row.origine,
    conteneur: row.conteneur,
    commentaire: row.commentaire,
    date: row.date,
    longueurValue: row.longueurValue ?? 0,
    longueurUnit: row.longueurUnit,
    largeurValue: row.largeurValue ?? 0,
    largeurUnit: row.largeurUnit,
    nombrePieces: row.nombrePieces ?? 0,
  };
}

export function ImportEntreesDialog() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [rows, setRows] = useState<ParsedEntreeRow[]>([]);
  const [tables, setTables] = useState<ImportTableMeta[]>([]);
  const [existingReferences, setExistingReferences] = useState<Set<string>>(
    new Set(),
  );
  const [readError, setReadError] = useState<string | null>(null);
  const [unmatchedHeaders, setUnmatchedHeaders] = useState<string[][]>([]);
  const [pending, setPending] = useState(false);
  const [selectionPending, setSelectionPending] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const resetState = () => {
    setRows([]);
    setTables([]);
    setReadError(null);
    setUnmatchedHeaders([]);
    setSubmitError(null);
  };

  const handleFileSelected = async (file: File) => {
    resetState();
    setDialogOpen(true);
    try {
      const buffer = await file.arrayBuffer();
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer);
      const result = parseWorkbook(workbook);

      if (result.tables.length === 0) {
        setUnmatchedHeaders(result.headerCandidates.map((c) => c.headers));
        setReadError(
          result.headerCandidates.length > 0
            ? "Aucun tableau reconnu dans ce fichier — voici les en-têtes trouvés."
            : "Aucune donnée reconnaissable n'a été trouvée dans ce fichier.",
        );
        return;
      }

      const existing = await getExistingReferences();
      setExistingReferences(new Set(existing));
      setRows(result.tables.flatMap((table) => table.rows));
      setTables(
        result.tables.map((table) => ({
          key: tableKey(table),
          sheet: table.sheet,
          tableIndex: table.tableIndex,
          longueurUnit: table.longueurUnit,
          largeurUnit: table.largeurUnit,
        })),
      );
    } catch {
      setReadError(
        "Ce fichier n'a pas pu être lu — vérifiez qu'il s'agit bien d'un fichier Excel (.xlsx).",
      );
    }
  };

  const isDraggingFile = useWindowFileDrop(handleFileSelected);

  const referenceCounts = countReferences(rows);
  const hasErrors = rows.some(
    (row) =>
      getRowFieldErrors(row, referenceCounts, existingReferences).size > 0,
  );
  // "N° Block"/"Bloc" maps to reference when a file has one (see
  // parseWorkbook), but plenty of files have no per-row unique id column at
  // all — typing one in by hand for every row defeats the point of
  // importing, so the submit button is replaced by this until every row has
  // something, rather than blocking on it silently
  const hasBlankReference = rows.some((row) => !row.reference);

  const generateRandomReferences = () => {
    const taken = new Set([
      ...existingReferences,
      ...rows.map((row) => row.reference).filter((ref) => ref !== null),
    ]);
    const nextRandomReference = () => {
      let candidate: string;
      do {
        candidate = `IMP-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
      } while (taken.has(candidate));
      taken.add(candidate);
      return candidate;
    };
    setRows(
      rows.map((row) =>
        row.reference ? row : { ...row, reference: nextRandomReference() },
      ),
    );
  };

  const handleTableUnitChange = (
    key: string,
    field: "longueur" | "largeur",
    unit: LengthUnit,
  ) => {
    const table = tables.find((t) => t.key === key);
    if (!table) return;
    haptic("selection");
    setRows((current) => reinterpretTableUnit(current, table, field, unit));
    setTables((current) =>
      current.map((t) =>
        t.key === key
          ? {
              ...t,
              [field === "longueur" ? "longueurUnit" : "largeurUnit"]: unit,
            }
          : t,
      ),
    );
  };

  // same correction as handleTableUnitChange, applied to every table in one
  // go — for a source file where every sheet/table really is in the same
  // wrong unit, fixing it table by table would be needless repetition
  const handleGlobalUnitChange = (
    field: "longueur" | "largeur",
    unit: LengthUnit,
  ) => {
    haptic("selection");
    setRows((current) =>
      tables.reduce(
        (acc, table) => reinterpretTableUnit(acc, table, field, unit),
        current,
      ),
    );
    setTables((current) =>
      current.map((t) => ({
        ...t,
        [field === "longueur" ? "longueurUnit" : "largeurUnit"]: unit,
      })),
    );
  };

  const handleSubmit = async () => {
    setPending(true);
    setSubmitError(null);
    try {
      const result = await importEntrees(rows.map(buildImportInput));
      if (result.error) {
        setSubmitError(result.error);
        return;
      }
      setDialogOpen(false);
      resetState();
      playChime("success");
    } catch {
      // a thrown server action (network drop, an unrelated server crash) —
      // caught live once already: without this, the button stayed a
      // spinner forever with no way to tell whether the import actually
      // went through
      setSubmitError(
        "La requête a échoué — vérifiez la connexion et réessayez. Si l'import a en fait réussi, les entrées seront visibles dans la liste.",
      );
    } finally {
      setPending(false);
    }
  };

  // imports only the rows selected within one table's block and keeps the
  // dialog open, so a batch can be worked through in pieces — fix the good
  // rows, import them, come back for the rest, without losing your place.
  // The rows that landed leave `rows`; existingReferences is re-fetched
  // since those references now exist for real, not just in this preview, so
  // a leftover row reusing one still gets caught before the next submit
  const handleImportSelected = async (selectedRows: ParsedEntreeRow[]) => {
    if (selectedRows.length === 0) return;
    setSelectionPending(true);
    setSubmitError(null);
    try {
      const result = await importEntrees(selectedRows.map(buildImportInput));
      if (result.error) {
        setSubmitError(result.error);
        return;
      }
      const importedIds = new Set(selectedRows.map((row) => row.id));
      setRows((current) => current.filter((row) => !importedIds.has(row.id)));
      setExistingReferences(new Set(await getExistingReferences()));
      playChime("success");
    } catch {
      setSubmitError(
        "La requête a échoué — vérifiez la connexion et réessayez. Si l'import a en fait réussi, les entrées seront visibles dans la liste.",
      );
    } finally {
      setSelectionPending(false);
    }
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (file) handleFileSelected(file);
        }}
      />
      <Button
        type="button"
        variant="outline"
        className="rounded-full corner-squircle"
        onClick={() => fileInputRef.current?.click()}
      >
        <Icon icon={ICONS.import} />
        Importer
      </Button>

      {/* covers the whole page (not just this button) the moment a file is
          dragged over it anywhere — dropping it goes straight into the same
          popup as clicking Importer would */}
      {isDraggingFile && (
        <div
          aria-hidden
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 backdrop-blur-sm"
        >
          <div className="flex flex-col items-center gap-3 rounded-2xl corner-squircle border-2 border-dashed border-primary p-12 text-primary">
            <Icon icon={ICONS.import} className="size-10" />
            <span className="text-lg font-semibold">
              Déposez le fichier ici
            </span>
          </div>
        </div>
      )}

      <Dialog
        open={dialogOpen}
        onOpenChange={(next) => {
          setDialogOpen(next);
          if (!next) resetState();
        }}
      >
        <DialogContent
          style={{ width: "min(100vw - 2rem, 72rem)" }}
          className="flex max-h-[calc(100dvh-2rem)] max-w-none flex-col sm:max-w-none"
        >
          <DialogHeader>
            <DialogTitle>
              Importer des{" "}
              <DialogTitleChip icon={ICONS.entree}>entrées</DialogTitleChip>
            </DialogTitle>
            <DialogDescription className="sr-only">
              Importer plusieurs entrées à partir d'un fichier Excel.
            </DialogDescription>
          </DialogHeader>

          <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto">
            {readError ? (
              <div className="flex flex-col gap-2">
                <FormError>{readError}</FormError>
                {unmatchedHeaders.length > 0 && (
                  <div className="flex flex-col gap-1 rounded-lg border border-border p-2 text-xs text-muted-foreground">
                    {unmatchedHeaders.map((headers, index) => (
                      // biome-ignore lint/suspicious/noArrayIndexKey: these rows have no stable identity, only their position in an error report that never reorders
                      <span key={index}>{headers.join(" · ")}</span>
                    ))}
                  </div>
                )}
              </div>
            ) : rows.length > 0 ? (
              <div className="flex flex-col gap-3">
                <span className="text-xs text-muted-foreground">
                  {rows.length} ligne{rows.length > 1 ? "s" : ""} détectée
                  {rows.length > 1 ? "s" : ""}
                </span>
                <ImportPreviewTables
                  {...{ tables, rows, existingReferences }}
                  onRowsChange={setRows}
                  onTableUnitChange={handleTableUnitChange}
                  onGlobalUnitChange={handleGlobalUnitChange}
                  onImportRows={handleImportSelected}
                  importPending={selectionPending}
                />
              </div>
            ) : (
              <p className="flex items-center gap-1.5 py-6 text-sm text-muted-foreground">
                <Icon icon={ICONS.retry} className="animate-spin" />
                Lecture du fichier...
              </p>
            )}
          </div>

          <FormError>{submitError}</FormError>
          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setDialogOpen(false)}
            >
              <Icon icon={ICONS.cancel} />
              {fr.common.cancel}
            </Button>
            {hasBlankReference ? (
              <Button type="button" onClick={generateRandomReferences}>
                <Icon icon={ICONS.dice} />
                Générer des références aléatoires
              </Button>
            ) : (
              <SubmitButton
                icon={ICONS.check}
                {...{ pending }}
                disabled={rows.length === 0 || hasErrors}
                onClick={handleSubmit}
              >
                Importer{" "}
                {rows.length > 1 ? `${rows.length} entrées` : "l'entrée"}
              </SubmitButton>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
