"use client";

import type { ReactNode, RefObject } from "react";
import { Icon } from "@/components/Icon";
import type { Card } from "@/components/useCardCarousel";
import { Button } from "@/shadcn/ui/button";
import { ICONS } from "@/utils/icon";

// the snap-scroll strip + prev/next/counter chrome shared by every
// multi-fiche add flow (entrées, sorties) — only what each fiche renders as
// differs, via renderCard
export function CardCarouselShell<T>({
  cards,
  activeIndex,
  onNavigate,
  scrollRef,
  renderCard,
}: {
  cards: Card<T>[];
  activeIndex: number;
  onNavigate: (index: number) => void;
  scrollRef: RefObject<HTMLDivElement | null>;
  renderCard: (card: Card<T>) => ReactNode;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-2">
      <div
        ref={scrollRef}
        className="mask-x-from-88% flex min-w-0 snap-x snap-mandatory gap-3 overflow-x-auto px-[6%] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {cards.map(renderCard)}
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
