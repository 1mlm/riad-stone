"use client";

import type { RefObject } from "react";
import { CardCarouselShell } from "@/components/CardCarouselShell";
import type { Card } from "@/components/useCardCarousel";
import { SortieCard } from "./SortieCard";
import type { SortieCardValues } from "./types";

export function CardsCarousel({
  cards,
  activeIndex,
  invalidCardId,
  confirmedCardIds,
  maxPieces,
  fieldSuggestions,
  onToggleCardConfirmed,
  onDeleteCard,
  onCloneCard,
  onNavigate,
  onAddCard,
  scrollRef,
  setCardRef,
}: {
  cards: Card<SortieCardValues>[];
  activeIndex: number;
  invalidCardId: string | undefined;
  confirmedCardIds: string[];
  maxPieces: number | undefined;
  fieldSuggestions: { bonCommande: string[] };
  onToggleCardConfirmed: (id: string) => void;
  onDeleteCard: (id: string) => void;
  onCloneCard: (id: string) => void;
  onNavigate: (index: number) => void;
  onAddCard: () => void;
  scrollRef: RefObject<HTMLDivElement | null>;
  setCardRef: (id: string) => (el: HTMLDivElement | null) => void;
}) {
  return (
    <CardCarouselShell
      {...{ cards, activeIndex, onNavigate, onAddCard, scrollRef }}
      renderCard={(card) => (
        <SortieCard
          key={card.id}
          {...{ card, maxPieces, fieldSuggestions }}
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
