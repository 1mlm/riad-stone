"use client";

import type { RefObject } from "react";
import { Icon } from "@/components/Icon";
import { Button } from "@/shadcn/ui/button";
import { ICONS } from "@/utils/icon";
import { EntreeCard } from "./EntreeCard";
import type { Card } from "./useEntreeCardCarousel";

export function CardsCarousel({
  cards,
  activeIndex,
  invalidCardId,
  onDeleteCard,
  onNavigate,
  scrollRef,
  setCardRef,
  fieldSuggestions,
}: {
  cards: Card[];
  activeIndex: number;
  invalidCardId: string | undefined;
  onDeleteCard: (id: string) => void;
  onNavigate: (index: number) => void;
  scrollRef: RefObject<HTMLDivElement | null>;
  setCardRef: (id: string) => (el: HTMLDivElement | null) => void;
  fieldSuggestions: { origine: string[]; conteneur: string[] };
}) {
  return (
    <div className="flex min-w-0 flex-col gap-2">
      <div
        ref={scrollRef}
        className="mask-x-from-88% flex min-w-0 snap-x snap-mandatory gap-3 overflow-x-auto px-[6%] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {cards.map((card) => (
          <EntreeCard
            key={card.id}
            {...{ card, fieldSuggestions }}
            invalid={card.id === invalidCardId}
            onDelete={() => onDeleteCard(card.id)}
            cardRef={setCardRef(card.id)}
          />
        ))}
      </div>
      <div className="flex items-center justify-center gap-3">
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          className="corner-squircle"
          disabled={activeIndex === 0}
          onClick={() => onNavigate(activeIndex - 1)}
        >
          <Icon icon={ICONS.chevronLeft} />
        </Button>
        <span className="text-xs text-muted-foreground">
          {activeIndex + 1} / {cards.length}
        </span>
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          className="corner-squircle"
          disabled={activeIndex === cards.length - 1}
          onClick={() => onNavigate(activeIndex + 1)}
        >
          <Icon icon={ICONS.chevronRight} />
        </Button>
      </div>
    </div>
  );
}
