"use client";

import { EditIcon } from "@hugeicons/core-free-icons";
import {
  type ReactNode,
  useActionState,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Combobox } from "@/components/Combobox";
import { DialogTitleChip } from "@/components/DialogTitleChip";
import { EntreeDetailsDialog } from "@/components/EntreeDetailsDialog";
import { FieldLabel } from "@/components/FieldLabel";
import { FormDialog } from "@/components/FormDialog";
import { Icon } from "@/components/Icon";
import { restoreFormValues } from "@/components/restoreFormValues";
import { useCardCarousel } from "@/components/useCardCarousel";
import { Button } from "@/shadcn/ui/button";
import { InputGroup, InputGroupInput } from "@/shadcn/ui/input-group";
import { cn } from "@/shadcn/utils";
import { formatShortDate } from "@/utils/date";
import { ICONS } from "@/utils/icon";
import { playChime } from "@/utils/sound";
import { type CreateSortiesResult, createSorties } from "./actions";
import { CardsCarousel } from "./CardsCarousel";
import type { AvailableEntree, SortieCardValues } from "./types";

function EntreeReferenceField({
  availableEntrees,
  entreeReference,
  onSelect,
  onClear,
  invalid,
}: {
  availableEntrees: AvailableEntree[];
  entreeReference: string;
  onSelect: (reference: string) => void;
  onClear: () => void;
  invalid: boolean;
}) {
  if (!entreeReference)
    return (
      <Combobox
        name="entreeReference"
        value={entreeReference}
        onValueChange={onSelect}
        options={availableEntrees.map((entree) => ({
          value: entree.reference,
          searchText: `${entree.reference} ${entree.designation}`,
          content: (
            <span className="flex items-center gap-2">
              <span className="shrink-0 font-mono font-semibold">
                {entree.reference}
              </span>
              <span className="shrink-0 text-xs text-muted-foreground">
                {formatShortDate(entree.date)}
              </span>
              <span className="min-w-0 flex-1 truncate">
                {entree.designation}
              </span>
              <span className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
                <Icon icon={ICONS.pieces} />
                {entree.piecesRestantes}/{entree.piecesTotal}
              </span>
            </span>
          ),
        }))}
        placeholder="Sélectionner une entrée..."
        searchPlaceholder="Rechercher une référence..."
        emptyLabel="Aucune entrée disponible."
        required
        ariaInvalid={invalid}
      />
    );

  return (
    <div className="flex items-center gap-1.5">
      <input type="hidden" name="entreeReference" value={entreeReference} />
      <InputGroup className="flex-1">
        <InputGroupInput
          defaultValue={entreeReference}
          readOnly
          disabled
          className="font-mono"
        />
      </InputGroup>
      <Button
        type="button"
        variant="outline"
        size="icon-sm"
        className="corner-squircle"
        onClick={onClear}
      >
        <Icon icon={EditIcon} />
      </Button>
      <EntreeDetailsDialog reference={entreeReference} allowAddSortie={false} />
    </div>
  );
}

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
  // pre-selects the entrée reference and skips the combobox — used when
  // opening this dialog from a specific entrée's details rather than the
  // sorties page, where the user should still pick freely
  initialReference?: string;
  // notified after a successful submit, on top of the dialog's own
  // close/reset — EntreeDetailsDialog uses this to refresh its stale
  // pièces-restantes/sorties list instead of showing what it fetched before
  // this sortie existed
  onSuccess?: () => void;
  trigger?: ReactNode;
}) {
  const [entreeReference, setEntreeReference] = useState(
    initialReference ?? "",
  );
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

  const selectedEntree = useMemo(
    () =>
      availableEntrees.find((entree) => entree.reference === entreeReference),
    [availableEntrees, entreeReference],
  );

  const resetState = () => {
    setEntreeReference("");
    resetCarousel();
  };

  // each fiche's own "max" only caps it against the entrée's full
  // piecesRestantes, not against what the other fiches in this same
  // submission already claim — this running total is what actually catches
  // an over-allocation before the server round-trip does. Fiche inputs are
  // uncontrolled, so it's recomputed from the DOM: on every fiche's own
  // input event (bubbling up to the wrapping div below), and whenever a
  // fiche is added/cloned/removed
  const [sumPieces, setSumPieces] = useState(0);
  const recomputeSumPieces = () => {
    setSumPieces(
      cards.reduce(
        (sum, card) =>
          sum + (Number(getCardFieldValue(card.id, "nombrePieces")) || 0),
        0,
      ),
    );
  };
  // biome-ignore lint/correctness/useExhaustiveDependencies: getCardFieldValue is a fresh closure every render — only cards actually needs to retrigger this
  useEffect(recomputeSumPieces, [cards]);

  // every field on the source fiche is currently visible only in its
  // uncontrolled DOM input (see useCardCarousel's module comment) — read
  // them all before seeding the new fiche, which mounts them back as
  // defaultValues through the normal SortieFormFields plumbing
  const cloneCard = (sourceId: string) => {
    const nombrePieces = getCardFieldValue(sourceId, "nombrePieces");
    const dateSortie = getCardFieldValue(sourceId, "dateSortie");
    addCard({
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

  return (
    <FormDialog
      {...{ open, formAction, pending }}
      wide
      onOpenChange={(next) => {
        setOpen(next);
        // opening straight onto an empty state costs a click before you can
        // type anything, so the first fiche is always already there
        if (next) {
          if (cards.length === 0) addCard();
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
      description="Formulaire de sortie d'une entrée en stock."
      error={state.error}
      submitIcon={ICONS.check}
      submitDisabled={cards.length === 0}
      submitLabel={
        <>
          Ajouter {cards.length > 1 ? `${cards.length} sorties` : "la sortie"}
        </>
      }
    >
      <input
        type="hidden"
        name="cardIds"
        value={cards.map((c) => c.id).join(",")}
      />
      <div className="flex flex-col gap-1.5">
        <FieldLabel icon={ICONS.reference} required>
          Référence de l'entrée
        </FieldLabel>
        <EntreeReferenceField
          {...{ availableEntrees, entreeReference }}
          onSelect={setEntreeReference}
          onClear={() => setEntreeReference("")}
          invalid={Boolean(state.error) && !entreeReference}
        />
      </div>

      {selectedEntree && (
        <p
          className={cn(
            "text-xs",
            sumPieces > selectedEntree.piecesRestantes
              ? "font-medium text-destructive"
              : "text-muted-foreground",
          )}
        >
          Total alloué : {sumPieces} / {selectedEntree.piecesRestantes} pièces
        </p>
      )}
      <div onInput={recomputeSumPieces}>
        <CardsCarousel
          {...{
            cards,
            activeIndex,
            invalidCardId,
            confirmedCardIds,
            scrollRef,
            setCardRef,
            fieldSuggestions,
          }}
          maxPieces={selectedEntree?.piecesRestantes}
          onToggleCardConfirmed={toggleCardConfirmed}
          onDeleteCard={deleteCard}
          onCloneCard={cloneCard}
          onNavigate={navigateTo}
          onAddCard={() => addCard()}
        />
      </div>
    </FormDialog>
  );
}
