import { useRef, useState } from "react";

export type Card<TInitialValues> = {
  id: string;
  initialValues?: TInitialValues;
};

// crypto.randomUUID needs a secure context and a fairly recent browser —
// falls back to a simple unique-enough id so card creation never breaks
const newCardId = () =>
  typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

// owns the multi-card carousel shared by AddEntreeDialog and AddSortieDialog:
// which cards exist, which one is in view/invalid, the scroll-into-view
// navigation between them, and reading a card's live field values straight
// off the DOM (its inputs are uncontrolled, so React state never holds
// them — see restoreFormValues.ts for the same reasoning). cardElements is a
// plain ref map (not state) since it only drives imperative scrollIntoView
// calls and DOM lookups, never a re-render
export function useCardCarousel<TInitialValues = never>() {
  const [cards, setCards] = useState<Card<TInitialValues>[]>([]);
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

  const addCard = (initialValues?: TInitialValues) => {
    const card = { id: newCardId(), initialValues };
    const index = cards.length;
    setCards((prev) => [...prev, card]);
    requestAnimationFrame(() => scrollToCard(card.id, index));
    return card.id;
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

  // a namespaced field's current value, read straight off the DOM (see the
  // module comment — these inputs are uncontrolled)
  const getCardFieldValue = (cardId: string, fieldName: string): string =>
    cardElements.current
      .get(cardId)
      ?.querySelector<HTMLInputElement | HTMLTextAreaElement>(
        `[name="${cardId}__${fieldName}"]`,
      )?.value ?? "";

  // finds, among existing cards, whichever has `fieldName` equal to `value`
  // right now — closest to whichever card is currently in view. Used e.g. to
  // jump to one of two cards sharing a duplicate reference after a
  // server-side validation error
  const findCardByFieldValue = (fieldName: string, value: string) => {
    const matches = cards
      .map((card, index) => ({ card, index }))
      .filter(({ card }) => getCardFieldValue(card.id, fieldName) === value);
    if (matches.length === 0) return undefined;
    return matches.reduce((a, b) =>
      Math.abs(a.index - activeIndex) <= Math.abs(b.index - activeIndex)
        ? a
        : b,
    );
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
    getCardFieldValue,
    findCardByFieldValue,
  };
}
