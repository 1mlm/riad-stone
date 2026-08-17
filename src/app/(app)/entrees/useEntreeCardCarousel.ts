import { useRef, useState } from "react";

export type Card = { id: string };

// crypto.randomUUID needs a secure context and a fairly recent browser —
// falls back to a simple unique-enough id so card creation never breaks
const newCardId = () =>
  typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

// owns the multi-card carousel used by AddEntreeDialog: which cards exist,
// which one is in view/invalid, and the scroll-into-view navigation between
// them. cardElements is a plain ref map (not state) since it only drives
// imperative scrollIntoView calls and DOM lookups, never a re-render
export function useEntreeCardCarousel() {
  const [cards, setCards] = useState<Card[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [invalidCardId, setInvalidCardId] = useState<string>();
  const scrollRef = useRef<HTMLDivElement>(null);
  const cardElements = useRef(new Map<string, HTMLDivElement>());

  const setCardRef = (id: string) => (el: HTMLDivElement | null) => {
    if (el) cardElements.current.set(id, el);
    else cardElements.current.delete(id);
  };

  const scrollToCard = (id: string, index: number) => {
    setActiveIndex(index);
    cardElements.current.get(id)?.scrollIntoView({
      behavior: "smooth",
      inline: "center",
      block: "nearest",
    });
  };

  const navigateTo = (index: number) => {
    const card = cards[index];
    if (!card) return;
    scrollToCard(card.id, index);
  };

  const addCard = () => {
    const card = { id: newCardId() };
    const index = cards.length;
    setCards((prev) => [...prev, card]);
    requestAnimationFrame(() => scrollToCard(card.id, index));
  };

  const deleteCard = (id: string) => {
    const index = cards.findIndex((c) => c.id === id);
    const next = cards.filter((c) => c.id !== id);
    setCards(next);
    cardElements.current.delete(id);
    if (next.length === 0) return;
    requestAnimationFrame(() => navigateTo(Math.min(index, next.length - 1)));
  };

  const resetState = () => {
    setCards([]);
    setActiveIndex(0);
    setInvalidCardId(undefined);
    cardElements.current.clear();
  };

  // on a duplicate-reference error, jump to whichever of the (possibly two)
  // matching cards is closest to the one currently in view — the reference
  // inputs are uncontrolled, so their live value is read straight off the DOM
  const jumpToDuplicate = (reference: string) => {
    const matches = cards
      .map((card, index) => ({ card, index }))
      .filter(({ card }) => {
        const input = cardElements.current
          .get(card.id)
          ?.querySelector<HTMLInputElement>(`[name="${card.id}__reference"]`);
        return input?.value.trim() === reference;
      });
    if (matches.length === 0) return;
    const closest = matches.reduce((a, b) =>
      Math.abs(a.index - activeIndex) <= Math.abs(b.index - activeIndex)
        ? a
        : b,
    );
    setInvalidCardId(closest.card.id);
    navigateTo(closest.index);
  };

  return {
    cards,
    activeIndex,
    invalidCardId,
    setInvalidCardId,
    scrollRef,
    setCardRef,
    scrollToCard,
    navigateTo,
    addCard,
    deleteCard,
    resetState,
    jumpToDuplicate,
  };
}
