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
  maxPieces,
  onDeleteCard,
  onCloneCard,
  onNavigate,
  scrollRef,
  setCardRef,
}: {
  cards: Card<SortieCardValues>[];
  activeIndex: number;
  invalidCardId: string | undefined;
  maxPieces: number | undefined;
  onDeleteCard: (id: string) => void;
  onCloneCard: (id: string) => void;
  onNavigate: (index: number) => void;
  scrollRef: RefObject<HTMLDivElement | null>;
  setCardRef: (id: string) => (el: HTMLDivElement | null) => void;
}) {
  return (
    <CardCarouselShell
      {...{ cards, activeIndex, onNavigate, scrollRef }}
      renderCard={(card) => (
        <SortieCard
          key={card.id}
          {...{ card, maxPieces }}
          invalid={card.id === invalidCardId}
          onDelete={() => onDeleteCard(card.id)}
          onClone={() => onCloneCard(card.id)}
          cardRef={setCardRef(card.id)}
        />
      )}
    />
  );
}
