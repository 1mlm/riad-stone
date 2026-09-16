"use client";

import ExcelJS from "exceljs";
import { useState } from "react";
import { DialogTitleChip } from "@/components/DialogTitleChip";
import { FormError } from "@/components/FormError";
import { Icon } from "@/components/Icon";
import { SubmitButton } from "@/components/SubmitButton";
import { Button } from "@/shadcn/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shadcn/ui/dialog";
import { cn } from "@/shadcn/utils";
import { ICONS } from "@/utils/icon";
import { playChime } from "@/utils/sound";
import { getExistingReferences, importEntrees } from "../actions";
import { ImportPreviewTable } from "./ImportPreviewTable";
import { ImportStepPicker } from "./ImportStepPicker";
import { parseWorkbook } from "./parseWorkbook";
import type { ParsedEntreeRow } from "./types";
import { countReferences, getRowFieldErrors } from "./validateImportRow";

type Step = "pick" | "preview";

export function ImportEntreesDialog() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("pick");
  const [rows, setRows] = useState<ParsedEntreeRow[]>([]);
  const [existingReferences, setExistingReferences] = useState<Set<string>>(
    new Set(),
  );
  const [readError, setReadError] = useState<string | null>(null);
  const [unmatchedHeaders, setUnmatchedHeaders] = useState<string[][]>([]);
  const [pending, setPending] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const resetState = () => {
    setStep("pick");
    setRows([]);
    setReadError(null);
    setUnmatchedHeaders([]);
    setSubmitError(null);
  };

  const handleFileSelected = async (file: File) => {
    setReadError(null);
    setUnmatchedHeaders([]);
    try {
      const buffer = await file.arrayBuffer();
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer);
      const result = parseWorkbook(workbook);

      if (result.tables.length === 0) {
        setUnmatchedHeaders(result.headerCandidates.map((c) => c.headers));
        setReadError(
          result.headerCandidates.length > 0
            ? "Aucun tableau reconnu — voici les en-têtes trouvés, à comparer avec le modèle."
            : "Aucune donnée reconnaissable n'a été trouvée dans ce fichier.",
        );
        return;
      }

      const [existing] = await Promise.all([getExistingReferences()]);
      setExistingReferences(new Set(existing));
      setRows(result.tables.flatMap((table) => table.rows));
      setStep("preview");
    } catch {
      setReadError(
        "Ce fichier n'a pas pu être lu — vérifiez qu'il s'agit bien d'un fichier Excel (.xlsx).",
      );
    }
  };

  const referenceCounts = countReferences(rows);
  const hasErrors = rows.some(
    (row) =>
      getRowFieldErrors(row, referenceCounts, existingReferences).size > 0,
  );

  const handleSubmit = async () => {
    setPending(true);
    setSubmitError(null);
    try {
      const result = await importEntrees(
        rows.map((row) => ({
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
        })),
      );
      if (result.error) {
        setSubmitError(result.error);
        return;
      }
      setOpen(false);
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

  return (
    <Dialog
      {...{ open }}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) resetState();
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" className="rounded-full corner-squircle">
          <Icon icon={ICONS.import} />
          Importer
        </Button>
      </DialogTrigger>
      <DialogContent
        style={{ width: "min(100vw - 2rem, 64rem)" }}
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

        {/* the picker and the preview sit side by side in a strip twice the
            dialog's width, translated left once a file is chosen — the
            dialog's own overflow-x-hidden (below) clips whichever half isn't
            showing, so this is a pure CSS transition, no library */}
        <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto">
          <div
            className={cn(
              "flex w-[200%] transition-transform duration-300 ease-in-out",
              step === "preview" && "-translate-x-1/2",
            )}
          >
            <div className="flex w-1/2 flex-col gap-3 pr-2">
              <ImportStepPicker onFileSelected={handleFileSelected} />
              {readError && (
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
              )}
            </div>
            <div className="flex w-1/2 flex-col gap-3 pl-2">
              {step === "preview" && (
                <>
                  <div className="flex items-center justify-between gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setStep("pick");
                        setRows([]);
                      }}
                    >
                      <Icon icon={ICONS.back} />
                      Choisir un autre fichier
                    </Button>
                    <span className="text-xs text-muted-foreground">
                      {rows.length} ligne{rows.length > 1 ? "s" : ""}
                    </span>
                  </div>
                  <ImportPreviewTable
                    {...{ rows, existingReferences }}
                    onRowsChange={setRows}
                  />
                </>
              )}
            </div>
          </div>
        </div>

        <FormError>{submitError}</FormError>
        {step === "preview" && (
          <DialogFooter>
            <SubmitButton
              icon={ICONS.check}
              {...{ pending }}
              disabled={rows.length === 0 || hasErrors}
              onClick={handleSubmit}
            >
              Importer {rows.length > 1 ? `${rows.length} entrées` : "l'entrée"}
            </SubmitButton>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
