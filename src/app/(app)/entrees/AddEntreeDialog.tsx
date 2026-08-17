"use client";

import { PlusSignIcon } from "@hugeicons/core-free-icons";
import { useActionState, useState } from "react";
import { DialogTitleChip } from "@/components/DialogTitleChip";
import { FieldLabel } from "@/components/FieldLabel";
import { FormDialog } from "@/components/FormDialog";
import { Icon } from "@/components/Icon";
import { Button } from "@/shadcn/ui/button";
import { ICONS } from "@/utils/icon";
import { playChime } from "@/utils/sound";
import { type CreateEntreesResult, createEntrees } from "./actions";
import { CardsCarousel } from "./CardsCarousel";
import { DesignationCombobox } from "./DesignationCombobox";
import { ENTREE_FIELD_BY_KEY } from "./fields";
import { restoreFormValues } from "./restoreFormValues";
import { useEntreeCardCarousel } from "./useEntreeCardCarousel";

export function AddEntreeDialog({
  designationSuggestions,
  fieldSuggestions,
}: {
  designationSuggestions: string[];
  fieldSuggestions: { origine: string[]; conteneur: string[] };
}) {
  const [open, setOpen] = useState(false);
  const [designation, setDesignation] = useState("");
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
    jumpToDuplicate,
  } = useEntreeCardCarousel();

  const resetState = () => {
    setDesignation("");
    resetCarousel();
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
        playChime("success");
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
    <FormDialog
      {...{ open, formAction, pending }}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) resetState();
      }}
      trigger={
        <Button className="rounded-full corner-squircle">
          <Icon icon={PlusSignIcon} />
          Ajouter une entrée
        </Button>
      }
      title={
        <>
          Ajouter une{" "}
          <DialogTitleChip icon={ICONS.entree}>entrée</DialogTitleChip>
        </>
      }
      description="Formulaire d'ajout d'une ou plusieurs entrées en stock partageant une même désignation."
      error={state.error}
      submitIcon={PlusSignIcon}
      submitDisabled={cards.length === 0}
      submitLabel={
        <>Ajouter {cards.length > 1 ? `${cards.length} entrées` : "l'entrée"}</>
      }
    >
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
              fieldSuggestions,
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
    </FormDialog>
  );
}
