"use client";

import { useRef } from "react";
import { Icon } from "@/components/Icon";
import { Button } from "@/shadcn/ui/button";
import { ICONS } from "@/utils/icon";
import { downloadImportTemplate } from "./generateTemplate";
import { useShowUntilVisitLimit } from "./useShowUntilVisitLimit";

// step 1 (télécharger le modèle) and step 2 (choisir un fichier) side by
// side, divided by one line that runs vertically on a wide screen and
// horizontally once there's no room for two columns
export function ImportStepPicker({
  onFileSelected,
}: {
  onFileSelected: (file: File) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const showExplanation = useShowUntilVisitLimit(
    "riad-stone:import-template-explanation-visits",
    10,
  );

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:gap-0">
      <div className="flex flex-1 flex-col items-start gap-2 sm:pr-4">
        <span className="text-xs font-semibold text-muted-foreground">
          1. Télécharger le modèle
        </span>
        <Button
          type="button"
          variant="outline"
          className="rounded-full corner-squircle"
          onClick={() => downloadImportTemplate()}
        >
          <Icon icon={ICONS.entree} />
          Télécharger le modèle
        </Button>
        {showExplanation && (
          <p className="text-xs text-muted-foreground">
            Un fichier Excel avec les bonnes colonnes, pré-rempli à titre
            d'exemple. Modifiez-le et réimportez-le, ou importez directement
            votre propre fichier — ses colonnes seront reconnues
            automatiquement.
          </p>
        )}
      </div>

      <div
        aria-hidden
        className="mx-2 hidden w-px self-stretch bg-border sm:block"
      />
      <div aria-hidden className="h-px w-full bg-border sm:hidden" />

      <div className="flex flex-1 flex-col items-start gap-2 sm:pl-4">
        <span className="text-xs font-semibold text-muted-foreground">
          2. Importer
        </span>
        <Button
          type="button"
          className="rounded-full corner-squircle"
          onClick={() => fileInputRef.current?.click()}
        >
          <Icon icon={ICONS.import} />
          Choisir un fichier
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = "";
            if (file) onFileSelected(file);
          }}
        />
      </div>
    </div>
  );
}
