"use client";

import { FicheCard } from "@/components/FicheCard";
import type { Card } from "@/components/useCardCarousel";
import { SortieFormFields } from "./SortieFormFields";
import type { SortieCardValues } from "./types";

export function SortieCard({
  card,
  maxPieces,
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
  maxPieces: number | undefined;
  fieldSuggestions: { bonCommande: string[] };
}) {
  return (
    <FicheCard {...chrome}>
      <SortieFormFields
        namePrefix={card.id}
        sortie={card.initialValues}
        {...{ maxPieces, fieldSuggestions }}
      />
    </FicheCard>
  );
}
