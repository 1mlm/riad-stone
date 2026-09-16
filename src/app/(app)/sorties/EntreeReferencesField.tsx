"use client";

import { MultiCombobox } from "@/components/Combobox";
import { FieldLabel } from "@/components/FieldLabel";
import { Icon } from "@/components/Icon";
import { cn } from "@/shadcn/utils";
import { formatShortDate } from "@/utils/date";
import { ICONS } from "@/utils/icon";
import type { AvailableEntree } from "./types";

// one fiche's entrées. Picking several makes this fiche create the same
// sortie once per entrée, which is why the pièces field it sits above has no
// single ceiling to cap itself against — the running total above the
// carousel breaks the allocation down per entrée instead
export function EntreeReferencesField({
  name,
  availableEntrees,
  values,
  remainingByReference,
  onValuesChange,
  invalid,
}: {
  name: string;
  availableEntrees: AvailableEntree[];
  values: string[];
  // pieces each entrée would have left once this submission lands
  remainingByReference: Record<string, number>;
  onValuesChange: (values: string[]) => void;
  invalid: boolean;
}) {
  const options = availableEntrees.map((entree) => {
    // what this entrée is left with once every fiche targeting it has taken
    // its share — going below zero is the over-allocation warning
    const remaining =
      remainingByReference[entree.reference] ?? entree.piecesRestantes;
    return {
      value: entree.reference,
      searchText: `${entree.reference} ${entree.designation}`,
      chipContent: (
        <>
          <span className="font-mono font-semibold">{entree.reference}</span>
          <span
            className={cn(
              remaining < 0
                ? "font-semibold text-destructive"
                : "text-muted-foreground",
            )}
          >
            {remaining}
          </span>
        </>
      ),
      content: (
        <span className="flex items-center gap-2">
          <span className="shrink-0 font-mono font-semibold">
            {entree.reference}
          </span>
          <span className="shrink-0 text-xs text-muted-foreground">
            {formatShortDate(entree.date)}
          </span>
          <span className="min-w-0 flex-1 truncate">{entree.designation}</span>
          <span className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
            <Icon icon={ICONS.pieces} />
            {entree.piecesRestantes}/{entree.piecesTotal}
          </span>
        </span>
      ),
    };
  });

  return (
    <div className="flex flex-col gap-1.5">
      <FieldLabel icon={ICONS.reference} required>
        Entrées concernées
      </FieldLabel>
      <MultiCombobox
        {...{ name, options, values, onValuesChange }}
        placeholder="Sélectionner une ou plusieurs entrées..."
        addMoreLabel="Ajouter une entrée..."
        searchPlaceholder="Rechercher une référence..."
        emptyLabel="Aucune entrée disponible."
        ariaInvalid={invalid}
      />
    </div>
  );
}
