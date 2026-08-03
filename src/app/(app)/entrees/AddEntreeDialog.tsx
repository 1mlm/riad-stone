"use client";

import { Delete02Icon, PlusSignIcon } from "@hugeicons/core-free-icons";
import { useActionState, useRef, useState } from "react";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { FieldLabel } from "@/components/FieldLabel";
import { FormError } from "@/components/FormError";
import { Icon } from "@/components/Icon";
import { Button } from "@/shadcn/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shadcn/ui/dialog";
import { cn } from "@/shadcn/utils";
import { ICONS } from "@/utils/icon";
import { type CreateEntreesResult, createEntrees } from "./actions";
import { DesignationCombobox } from "./DesignationCombobox";
import { EntreeFormFields } from "./EntreeFormFields";
import { ENTREE_FIELD_BY_KEY } from "./fields";

type Card = { id: string };

// crypto.randomUUID needs a secure context and a fairly recent browser —
// falls back to a simple unique-enough id so card creation never breaks
const newCardId = () =>
  typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

function EntreeCard({
  card,
  index,
  count,
  invalid,
  onDelete,
  cardRef,
}: {
  card: Card;
  index: number;
  count: number;
  invalid: boolean;
  onDelete: () => void;
  cardRef: (el: HTMLDivElement | null) => void;
}) {
  return (
    <div
      ref={cardRef}
      className={cn(
        // narrower than the scroll container so the next/previous card
        // peeks in on the sides instead of being fully clipped
        "flex w-[88%] shrink-0 snap-center flex-col gap-4 rounded-lg border border-border p-3",
        invalid && "border-destructive",
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          Fiche {index + 1} / {count}
        </span>
        <ConfirmDialog
          trigger={
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="text-destructive hover:text-destructive"
            >
              <Icon icon={Delete02Icon} />
            </Button>
          }
          title="Supprimer cette fiche ?"
          content="Les informations saisies dans cette fiche seront perdues."
          confirmLabel="Supprimer"
          confirmIcon={Delete02Icon}
          waitSeconds={0}
          onConfirm={async () => {
            onDelete();
            return undefined;
          }}
        />
      </div>
      <EntreeFormFields
        mode="add"
        namePrefix={card.id}
        excludeKeys={["designation"]}
      />
    </div>
  );
}

function CardsCarousel({
  cards,
  activeIndex,
  invalidCardId,
  onDeleteCard,
  onNavigate,
  scrollRef,
  setCardRef,
}: {
  cards: Card[];
  activeIndex: number;
  invalidCardId: string | undefined;
  onDeleteCard: (id: string) => void;
  onNavigate: (index: number) => void;
  scrollRef: React.RefObject<HTMLDivElement | null>;
  setCardRef: (id: string) => (el: HTMLDivElement | null) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div
        ref={scrollRef}
        className="mask-x-from-88% flex snap-x snap-mandatory gap-3 overflow-x-auto px-[6%] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {cards.map((card, index) => (
          <EntreeCard
            key={card.id}
            {...{ card, index }}
            count={cards.length}
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

export function AddEntreeDialog({
  designationSuggestions,
}: {
  designationSuggestions: string[];
}) {
  const [open, setOpen] = useState(false);
  const [designation, setDesignation] = useState("");
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
    setDesignation("");
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

  // React resets every uncontrolled field in the <form> once the action
  // settles, error or not — snapshot the raw values beforehand and, on
  // error, write them straight back so a failed submit doesn't wipe what
  // was typed into every card. The reset isn't synchronous with the action
  // promise settling, so a one-shot restore can lose the race — reassert
  // for a few frames instead of guessing the exact timing.
  const restoreFormValues = (values: [string, string][], framesLeft = 12) => {
    for (const [name, value] of values) {
      const el = document.querySelector<HTMLInputElement>(
        `[name="${CSS.escape(name)}"]`,
      );
      if (el && el.type !== "hidden" && el.value !== value) el.value = value;
    }
    if (framesLeft > 0)
      requestAnimationFrame(() => restoreFormValues(values, framesLeft - 1));
  };

  const [state, formAction, pending] = useActionState(
    async (
      _prevState: CreateEntreesResult,
      formData: FormData,
    ): Promise<CreateEntreesResult> => {
      setInvalidCardId(undefined);
      const values = [...formData.entries()].filter(
        (entry): entry is [string, string] => typeof entry[1] === "string",
      );
      const result = await createEntrees(_prevState, formData);
      if (!result.error) {
        setOpen(false);
        resetState();
        return result;
      }
      if (result.duplicateReference) jumpToDuplicate(result.duplicateReference);
      else if (result.invalidCardId) {
        const index = cards.findIndex((c) => c.id === result.invalidCardId);
        setInvalidCardId(result.invalidCardId);
        if (index !== -1) scrollToCard(result.invalidCardId, index);
      }
      restoreFormValues(values);
      return result;
    },
    { error: null },
  );

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) resetState();
      }}
    >
      <DialogTrigger asChild>
        <Button className="rounded-full corner-squircle">
          <Icon icon={PlusSignIcon} />
          Ajouter une entrée
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Ajouter une entrée</DialogTitle>
          <DialogDescription className="sr-only">
            Formulaire d'ajout d'une ou plusieurs entrées en stock partageant
            une même désignation.
          </DialogDescription>
        </DialogHeader>
        <form action={formAction} className="flex flex-col gap-4">
          <input
            type="hidden"
            name="cardIds"
            value={cards.map((c) => c.id).join(",")}
          />
          <div className="flex flex-col gap-1.5">
            <FieldLabel icon={ENTREE_FIELD_BY_KEY.designation.icon} required>
              {ENTREE_FIELD_BY_KEY.designation.label}
            </FieldLabel>
            <DesignationCombobox
              name="designation"
              value={designation}
              onValueChange={setDesignation}
              suggestions={designationSuggestions}
              placeholder="Granite, Ibiza..."
            />
          </div>

          {cards.length === 0 ? (
            <Button
              type="button"
              variant="outline"
              className="rounded-full corner-squircle"
              onClick={addCard}
            >
              <Icon icon={PlusSignIcon} />
              Ajouter une fiche
            </Button>
          ) : (
            <>
              <CardsCarousel
                {...{
                  cards,
                  activeIndex,
                  invalidCardId,
                  scrollRef,
                  setCardRef,
                }}
                onDeleteCard={deleteCard}
                onNavigate={navigateTo}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="corner-squircle"
                onClick={addCard}
              >
                <Icon icon={PlusSignIcon} />
                Ajouter une autre fiche
              </Button>
            </>
          )}

          <FormError>{state.error}</FormError>

          <DialogFooter>
            <Button type="submit" disabled={pending || cards.length === 0}>
              <Icon icon={PlusSignIcon} />
              Ajouter{" "}
              {cards.length > 1 ? `${cards.length} entrées` : "l'entrée"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
