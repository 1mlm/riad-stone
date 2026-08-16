"use client";

import { EditIcon, PlusSignIcon } from "@hugeicons/core-free-icons";
import { type ReactNode, useActionState, useMemo, useState } from "react";
import { Combobox } from "@/components/Combobox";
import { EntreeDetailsDialog } from "@/components/EntreeDetailsDialog";
import { FieldLabel } from "@/components/FieldLabel";
import { FormDialog } from "@/components/FormDialog";
import { Icon } from "@/components/Icon";
import { Button } from "@/shadcn/ui/button";
import { InputGroup, InputGroupInput } from "@/shadcn/ui/input-group";
import { ICONS } from "@/utils/icon";
import { createSortie } from "./actions";
import { SortieFormFields } from "./SortieFormFields";
import type { AvailableEntree } from "./types";

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
          label: `${entree.designation}: ${entree.piecesRestantes} pièce(s) restante(s)`,
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
  const [open, setOpen] = useState(false);
  const [entreeReference, setEntreeReference] = useState(
    initialReference ?? "",
  );
  const [state, formAction, pending] = useActionState(
    async (prevState: { error: string | null }, formData: FormData) => {
      const result = await createSortie(prevState, formData);
      if (!result.error) {
        setOpen(false);
        setEntreeReference("");
      }
      return result;
    },
    { error: null },
  );

  const selectedEntree = useMemo(
    () =>
      availableEntrees.find((entree) => entree.reference === entreeReference),
    [availableEntrees, entreeReference],
  );

  return (
    <FormDialog
      {...{ open, formAction, pending }}
      onOpenChange={setOpen}
      trigger={
        trigger ?? (
          <Button className="rounded-full corner-squircle">
            <Icon icon={PlusSignIcon} />
            Ajouter une sortie
          </Button>
        )
      }
      title="Ajouter une sortie"
      description="Formulaire de sortie d'une entrée en stock."
      error={state.error}
      submitIcon={PlusSignIcon}
      submitLabel="Ajouter"
    >
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

      <div className="flex flex-col gap-1.5">
        <FieldLabel htmlFor="nombrePieces" icon={ICONS.pieces} required>
          Nombre de pièces
          {selectedEntree && ` (max ${selectedEntree.piecesRestantes})`}
        </FieldLabel>
        <InputGroup>
          <InputGroupInput
            id="nombrePieces"
            name="nombrePieces"
            type="number"
            min="1"
            max={selectedEntree?.piecesRestantes}
            step="1"
            disabled={!selectedEntree}
            required
          />
        </InputGroup>
      </div>

      <SortieFormFields mode="add" />
    </FormDialog>
  );
}
