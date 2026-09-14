"use client";

import { EditIcon, PlusSignIcon } from "@hugeicons/core-free-icons";
import { type ReactNode, useActionState, useMemo, useState } from "react";
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
  initialReference,
  trigger,
}: {
  availableEntrees: AvailableEntree[];
  // pre-selects the entrée reference and skips the combobox — used when
  // opening this dialog from a specific entrée's details rather than the
  // sorties page, where the user should still pick freely
  initialReference?: string;
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
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) resetState();
      }}
      trigger={
        trigger ?? (
          <Button className="rounded-full corner-squircle">
            <Icon icon={PlusSignIcon} />
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
      submitIcon={PlusSignIcon}
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

      {cards.length === 0 ? (
        <Button
          type="button"
          variant="outline"
          className="rounded-full corner-squircle"
          disabled={!selectedEntree}
          onClick={() => addCard()}
        >
          <Icon icon={PlusSignIcon} />
          Ajouter une fiche
        </Button>
      ) : (
        <>
          <CardsCarousel
            {...{ cards, activeIndex, invalidCardId, scrollRef, setCardRef }}
            maxPieces={selectedEntree?.piecesRestantes}
            onDeleteCard={deleteCard}
            onCloneCard={cloneCard}
            onNavigate={navigateTo}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="corner-squircle"
            onClick={() => addCard()}
          >
            <Icon icon={PlusSignIcon} />
            Ajouter une autre fiche
          </Button>
        </>
      )}
    </FormDialog>
  );
}
