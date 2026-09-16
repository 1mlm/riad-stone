"use client";

import { type ReactNode, useActionState, useEffect, useState } from "react";
import { DialogTitleChip } from "@/components/DialogTitleChip";
import { FormDialog } from "@/components/FormDialog";
import { Icon } from "@/components/Icon";
import { restoreFormValues } from "@/components/restoreFormValues";
import { useCardCarousel } from "@/components/useCardCarousel";
import { Button } from "@/shadcn/ui/button";
import { cn } from "@/shadcn/utils";
import { ICONS } from "@/utils/icon";
import { playChime } from "@/utils/sound";
import { type CreateSortiesResult, createSorties } from "./actions";
import { CardsCarousel } from "./CardsCarousel";
import type { AvailableEntree, SortieCardValues } from "./types";

export function AddSortieDialog({
  availableEntrees,
  // EntreeDetailsDialog opens this without any past bonCommande values on
  // hand — falls back to no suggestions rather than making that a required
  // prop everywhere
  fieldSuggestions = { bonCommande: [] },
  initialReference,
  onSuccess,
  trigger,
}: {
  availableEntrees: AvailableEntree[];
  fieldSuggestions?: { bonCommande: string[] };
  // pre-selects the entrée on the first fiche — used when opening this
  // dialog from a specific entrée's details rather than the sorties page,
  // where the user should still pick freely
  initialReference?: string;
  // notified after a successful submit, on top of the dialog's own
  // close/reset — EntreeDetailsDialog uses this to refresh its stale
  // pièces-restantes/sorties list instead of showing what it fetched before
  // this sortie existed
  onSuccess?: () => void;
  trigger?: ReactNode;
}) {
  const {
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
    resetState: resetCarousel,
    getCardFieldValue,
  } = useCardCarousel<SortieCardValues>();

  // which entrées each fiche targets. Unlike every other fiche field these
  // can't live purely in the DOM — the chips have to re-render as they're
  // added and removed
  const [cardReferences, setCardReferences] = useState<
    Record<string, string[]>
  >({});

  const addFiche = (initialValues?: SortieCardValues) => {
    const id = addCard(initialValues);
    const references = initialValues?.entreeReferences;
    if (references?.length)
      setCardReferences((prev) => ({ ...prev, [id]: references }));
    return id;
  };

  const deleteFiche = (id: string) => {
    deleteCard(id);
    setCardReferences((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const resetState = () => {
    setCardReferences({});
    resetCarousel();
  };

  // one fiche pointing at several entrées takes its pièces from each of
  // them, and several fiches can point at the same entrée, so what actually
  // has to stay within an entrée's stock is the total claimed across every
  // fiche targeting it. Fiche inputs are uncontrolled, so this is recomputed
  // off the DOM: on any fiche's input event, and whenever fiches or their
  // chips change
  const [allocations, setAllocations] = useState<
    { reference: string; claimed: number; piecesRestantes: number }[]
  >([]);
  const recomputeAllocations = () => {
    const claimedByReference = new Map<string, number>();
    for (const card of cards) {
      const pieces = Number(getCardFieldValue(card.id, "nombrePieces")) || 0;
      for (const reference of cardReferences[card.id] ?? [])
        claimedByReference.set(
          reference,
          (claimedByReference.get(reference) ?? 0) + pieces,
        );
    }
    setAllocations(
      [...claimedByReference].map(([reference, claimed]) => ({
        reference,
        claimed,
        piecesRestantes:
          availableEntrees.find((entree) => entree.reference === reference)
            ?.piecesRestantes ?? 0,
      })),
    );
  };
  // biome-ignore lint/correctness/useExhaustiveDependencies: getCardFieldValue is a fresh closure every render — only cards and their chips should retrigger this
  useEffect(recomputeAllocations, [cards, cardReferences]);

  // every field on the source fiche is currently visible only in its
  // uncontrolled DOM input (see useCardCarousel's module comment) — read
  // them all before seeding the new fiche, which mounts them back as
  // defaultValues through the normal SortieFormFields plumbing
  const cloneCard = (sourceId: string) => {
    const nombrePieces = getCardFieldValue(sourceId, "nombrePieces");
    const dateSortie = getCardFieldValue(sourceId, "dateSortie");
    addFiche({
      entreeReferences: cardReferences[sourceId] ?? [],
      nombrePieces: nombrePieces ? Number(nombrePieces) : undefined,
      dateSortie: dateSortie ? new Date(dateSortie) : undefined,
      bonCommande: getCardFieldValue(sourceId, "bonCommande") || null,
      commentaire: getCardFieldValue(sourceId, "commentaire") || null,
    });
  };

  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(
    async (
      _prevState: CreateSortiesResult,
      formData: FormData,
    ): Promise<CreateSortiesResult> => {
      setInvalidCardId(undefined);
      const values = [...formData.entries()].filter(
        (entry): entry is [string, string] => typeof entry[1] === "string",
      );
      const result = await createSorties(_prevState, formData);
      if (!result.error) {
        setOpen(false);
        resetState();
        playChime("success");
        onSuccess?.();
        return result;
      }
      if (result.invalidCardId) {
        const index = cards.findIndex((c) => c.id === result.invalidCardId);
        setInvalidCardId(result.invalidCardId);
        if (index !== -1) scrollToCard(result.invalidCardId, index);
      }
      restoreFormValues(values);
      return result;
    },
    { error: null },
  );

  const totalSorties = cards.reduce(
    (total, card) => total + (cardReferences[card.id]?.length ?? 0),
    0,
  );

  return (
    <FormDialog
      {...{ open, formAction, pending }}
      wide
      onOpenChange={(next) => {
        setOpen(next);
        // opening straight onto an empty state costs a click before you can
        // type anything, so the first fiche is always already there
        if (next) {
          if (cards.length === 0)
            addFiche(
              initialReference
                ? { entreeReferences: [initialReference] }
                : undefined,
            );
        } else resetState();
      }}
      trigger={
        trigger ?? (
          <Button className="rounded-full corner-squircle">
            <Icon icon={ICONS.add} />
            Ajouter une sortie
          </Button>
        )
      }
      title={
        <>
          Ajouter une{" "}
          <DialogTitleChip icon={ICONS.sortie}>sortie</DialogTitleChip>
        </>
      }
      description="Formulaire de sortie d'une ou plusieurs entrées en stock."
      error={state.error}
      submitIcon={ICONS.check}
      submitDisabled={totalSorties === 0}
      submitLabel={
        <>
          Ajouter {totalSorties > 1 ? `${totalSorties} sorties` : "la sortie"}
        </>
      }
    >
      <input
        type="hidden"
        name="cardIds"
        value={cards.map((c) => c.id).join(",")}
      />

      {allocations.length > 0 && (
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs">
          {allocations.map(({ reference, claimed, piecesRestantes }) => (
            <span
              key={reference}
              className={cn(
                claimed > piecesRestantes
                  ? "font-medium text-destructive"
                  : "text-muted-foreground",
              )}
            >
              <span className="font-mono">{reference}</span> : {claimed}/
              {piecesRestantes} pièces
            </span>
          ))}
        </div>
      )}

      <div onInput={recomputeAllocations}>
        <CardsCarousel
          {...{
            cards,
            activeIndex,
            invalidCardId,
            confirmedCardIds,
            availableEntrees,
            cardReferences,
            scrollRef,
            setCardRef,
            fieldSuggestions,
          }}
          onCardReferencesChange={(id, references) =>
            setCardReferences((prev) => ({ ...prev, [id]: references }))
          }
          onToggleCardConfirmed={toggleCardConfirmed}
          onDeleteCard={deleteFiche}
          onCloneCard={cloneCard}
          onNavigate={navigateTo}
          onAddCard={() => addFiche()}
        />
      </div>
    </FormDialog>
  );
}
