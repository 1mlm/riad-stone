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
  // fiches the user ticked off as done — purely a visual/readOnly lock, they
  // still get created with everything else at submit. Nothing is written to
  // the database before the one transactional submit, so a tick can always be
  // undone
  const [confirmedCardIds, setConfirmedCardIds] = useState<string[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const cardElements = useRef(new Map<string, HTMLDivElement>());

  const setCardRef = (id: string) => (el: HTMLDivElement | null) => {
    if (el) cardElements.current.set(id, el);
    else cardElements.current.delete(id);
  };

  // scrolls the strip itself rather than calling scrollIntoView on the card:
  // scrollIntoView walks up and scrolls every scrollable ancestor too, which
  // includes the dialog's own overflow-x-hidden form — that shifted the whole
  // dialog sideways and clipped the fields sitting above the carousel
  const scrollToCard = (id: string, index: number) => {
    setActiveIndex(index);
    const card = cardElements.current.get(id);
    const strip = scrollRef.current;
    if (!card || !strip) return;
    const offsetWithinStrip =
      card.getBoundingClientRect().left - strip.getBoundingClientRect().left;
    const centeringOffset = (strip.clientWidth - card.clientWidth) / 2;
    strip.scrollTo({
      left: strip.scrollLeft + offsetWithinStrip - centeringOffset,
      behavior: "smooth",
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
    setConfirmedCardIds((prev) => prev.filter((cardId) => cardId !== id));
    cardElements.current.delete(id);
    if (next.length === 0) return;
    requestAnimationFrame(() => navigateTo(Math.min(index, next.length - 1)));
  };

  const toggleCardConfirmed = (id: string) =>
    setConfirmedCardIds((prev) =>
      prev.includes(id)
        ? prev.filter((cardId) => cardId !== id)
        : [...prev, id],
    );

  const resetState = () => {
    setCards([]);
    setActiveIndex(0);
    setInvalidCardId(undefined);
    setConfirmedCardIds([]);
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
    confirmedCardIds,
    toggleCardConfirmed,
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
