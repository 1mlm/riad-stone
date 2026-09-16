"use client";

import { FicheCard } from "@/components/FicheCard";
import type { Card } from "@/components/useCardCarousel";
import { EntreeReferencesField } from "./EntreeReferencesField";
import { SortieFormFields } from "./SortieFormFields";
import type { AvailableEntree, SortieCardValues } from "./types";

export function SortieCard({
  card,
  availableEntrees,
  entreeReferences,
  remainingByReference,
  onEntreeReferencesChange,
  fieldSuggestions,
  ...chrome
}: {
  card: Card<SortieCardValues>;
  invalid: boolean;
  confirmed: boolean;
  onToggleConfirmed: () => void;
  onDelete: () => void;
  onClone: () => void;
  cardRef: (el: HTMLDivElement | null) => void;
  availableEntrees: AvailableEntree[];
  entreeReferences: string[];
  remainingByReference: Record<string, number>;
  onEntreeReferencesChange: (references: string[]) => void;
  fieldSuggestions: { bonCommande: string[] };
}) {
  // several entrées on one fiche each give up the same number of pièces, so
  // the only ceiling that always holds is the smallest of them
  const maxPieces = entreeReferences.length
    ? Math.min(
        ...entreeReferences.map(
          (reference) =>
            availableEntrees.find((entree) => entree.reference === reference)
              ?.piecesRestantes ?? 0,
        ),
      )
    : undefined;

  return (
    <FicheCard {...chrome}>
      <SortieFormFields
        namePrefix={card.id}
        sortie={card.initialValues}
        {...{ maxPieces, fieldSuggestions }}
        entreePicker={
          <EntreeReferencesField
            name={`${card.id}__entreeReferences`}
            values={entreeReferences}
            onValuesChange={onEntreeReferencesChange}
            invalid={chrome.invalid}
            {...{ availableEntrees, remainingByReference }}
          />
        }
      />
    </FicheCard>
  );
}
