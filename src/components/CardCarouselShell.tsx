"use client";

import type { ReactNode, RefObject } from "react";
import { Icon } from "@/components/Icon";
import type { Card } from "@/components/useCardCarousel";
import { useHorizontalScrollFade } from "@/components/useHorizontalScrollFade";
import { Button } from "@/shadcn/ui/button";
import { ICONS } from "@/utils/icon";

// a fiche is always the same comfortable width — deliberately not a
// percentage of the dialog, which would leave a single fiche stranded in a
// wide empty dialog. The dialog sizes itself to the fiches instead (see
// FormDialog's `wide`), so it grows as they're added and only starts
// scrolling once it runs out of screen
export const FICHE_WIDTH_CLASS = "w-72 sm:w-80";

// how wide the dialog holding the carousel should be: enough for the fiches
// it currently has, the "+" tile and the padding around them, then capped so
// it stops at the screen's edge (and at a readable maximum on a huge one) and
// the strip starts scrolling instead. A scroll container contributes nothing
// to a fit-content parent's intrinsic width, so w-fit alone would collapse to
// a single fiche and clip the tile — the count has to drive it explicitly
export function getCarouselDialogWidth(ficheCount: number) {
  const ficheRem = 20;
  const gapRem = 0.75;
  // the "+" tile, the dialog's own padding and the form's scrollbar
  const tileAndPaddingRem = 7;
  const contentRem = ficheCount * (ficheRem + gapRem) + tileAndPaddingRem;
  return `min(100vw - 2rem, 72rem, ${contentRem}rem)`;
}

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
        className="flex min-w-0 snap-x snap-mandatory items-stretch gap-3 overflow-x-auto px-0.5 py-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
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
