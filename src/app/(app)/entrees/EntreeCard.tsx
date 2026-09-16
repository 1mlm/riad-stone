"use client";

import { FicheCard } from "@/components/FicheCard";
import type { Card } from "@/components/useCardCarousel";
import { EntreeFormFields } from "./EntreeFormFields";
import type { EntreeRow } from "./types";

export function EntreeCard({
  card,
  fieldSuggestions,
  ...chrome
}: {
  card: Card<Partial<EntreeRow>>;
  invalid: boolean;
  confirmed: boolean;
  onToggleConfirmed: () => void;
  onDelete: () => void;
  onClone: () => void;
  cardRef: (el: HTMLDivElement | null) => void;
  fieldSuggestions: { origine: string[]; conteneur: string[] };
}) {
  return (
    <FicheCard {...chrome}>
      <EntreeFormFields
        mode="add"
        namePrefix={card.id}
        entree={card.initialValues}
        excludeKeys={["designation"]}
        suggestions={fieldSuggestions}
      />
    </FicheCard>
  );
}
