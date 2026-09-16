"use client";

import type { ReactNode, RefObject } from "react";
import { Icon } from "@/components/Icon";
import type { Card } from "@/components/useCardCarousel";
import { useHorizontalScrollFade } from "@/components/useHorizontalScrollFade";
import { Button } from "@/shadcn/ui/button";
import { ICONS } from "@/utils/icon";

// one source of truth for how wide a fiche is at each breakpoint — the wider
// the screen, the more fiches fit, so on a big screen you see several at once
// instead of one at a time with slivers of its neighbours
export const FICHE_WIDTH_CLASS = "w-[86%] sm:w-[60%] lg:w-[42%] xl:w-[32%]";

// the snap-scroll strip + prev/next/counter chrome shared by every
// multi-fiche add flow (entrées, sorties) — only what each fiche renders as
// differs, via renderCard
export function CardCarouselShell<T>({
  cards,
  activeIndex,
  onNavigate,
  onAddCard,
  scrollRef,
  renderCard,
}: {
  cards: Card<T>[];
  activeIndex: number;
  onNavigate: (index: number) => void;
  onAddCard: () => void;
  scrollRef: RefObject<HTMLDivElement | null>;
  renderCard: (card: Card<T>) => ReactNode;
}) {
  const maskImage = useHorizontalScrollFade(scrollRef, {
    deps: [cards.length],
  });

  return (
    <div className="flex min-w-0 flex-col gap-2">
      <div
        ref={scrollRef}
        style={{ maskImage, WebkitMaskImage: maskImage }}
        className="flex min-w-0 snap-x snap-mandatory items-stretch gap-3 overflow-x-auto px-[6%] py-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {cards.map(renderCard)}
        <button
          type="button"
          onClick={onAddCard}
          title="Ajouter une fiche"
          className="flex w-14 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-dashed border-border text-muted-foreground transition-colors hover:border-ring hover:bg-accent hover:text-foreground"
        >
          <Icon icon={ICONS.add} />
        </button>
      </div>
      {/* nothing to navigate between with a single fiche, and "1 / 1" between
          two dead arrows is just noise */}
      {cards.length > 1 && (
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
      )}
    </div>
  );
}
