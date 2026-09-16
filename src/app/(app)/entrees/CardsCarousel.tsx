"use client";

import type { RefObject } from "react";
import { CardCarouselShell } from "@/components/CardCarouselShell";
import type { Card } from "@/components/useCardCarousel";
import { EntreeCard } from "./EntreeCard";
import type { EntreeRow } from "./types";

export function CardsCarousel({
  cards,
  activeIndex,
  invalidCardId,
  confirmedCardIds,
  onToggleCardConfirmed,
  onDeleteCard,
  onCloneCard,
  onNavigate,
  onAddCard,
  scrollRef,
  setCardRef,
  fieldSuggestions,
}: {
  cards: Card<Partial<EntreeRow>>[];
  activeIndex: number;
  invalidCardId: string | undefined;
  confirmedCardIds: string[];
  onToggleCardConfirmed: (id: string) => void;
  onDeleteCard: (id: string) => void;
  onCloneCard: (id: string) => void;
  onNavigate: (index: number) => void;
  onAddCard: () => void;
  scrollRef: RefObject<HTMLDivElement | null>;
  setCardRef: (id: string) => (el: HTMLDivElement | null) => void;
  fieldSuggestions: { origine: string[]; conteneur: string[] };
}) {
  return (
    <CardCarouselShell
      {...{ cards, activeIndex, onNavigate, onAddCard, scrollRef }}
      renderCard={(card) => (
        <EntreeCard
          key={card.id}
          {...{ card, fieldSuggestions }}
          invalid={card.id === invalidCardId}
          confirmed={confirmedCardIds.includes(card.id)}
          onToggleConfirmed={() => onToggleCardConfirmed(card.id)}
          onDelete={() => onDeleteCard(card.id)}
          onClone={() => onCloneCard(card.id)}
          cardRef={setCardRef(card.id)}
        />
      )}
    />
  );
}
