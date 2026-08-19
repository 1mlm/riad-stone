"use client";

import { EditIcon } from "@hugeicons/core-free-icons";
import { DialogTitleChip } from "@/components/DialogTitleChip";
import { EntreeDetailsDialog } from "@/components/EntreeDetailsDialog";
import { FieldLabel } from "@/components/FieldLabel";
import { FormDialog } from "@/components/FormDialog";
import { RowMenuItemButton } from "@/components/table/RowMenu";
import { useFormDialogAction } from "@/components/useFormDialogAction";
import { InputGroup, InputGroupInput } from "@/shadcn/ui/input-group";
import { ICONS } from "@/utils/icon";
import { updateSortie } from "./actions";
import { SortieFormFields } from "./SortieFormFields";
import type { AvailableEntree, SortieRow } from "./types";

export function EditSortieDialog({
  sortie,
  availableEntrees,
}: {
  sortie: SortieRow;
  availableEntrees: AvailableEntree[];
}) {
  // availableEntrees.piecesRestantes already excludes this sortie's own
  // amount — add it back since editing releases it before re-applying
  const maxNombrePieces =
    (availableEntrees.find(
      (entree) => entree.reference === sortie.entreeReference,
    )?.piecesRestantes ?? 0) + sortie.nombrePieces;
  const { open, setOpen, state, formAction, pending } = useFormDialogAction(
    (prevState, formData) => updateSortie(sortie.id, prevState, formData),
  );

  return (
    <FormDialog
      {...{ open, formAction, pending }}
      onOpenChange={setOpen}
      trigger={<RowMenuItemButton icon={EditIcon}>Modifier</RowMenuItemButton>}
      title={
        <>
          Modifier la{" "}
          <DialogTitleChip icon={ICONS.sortie}>sortie</DialogTitleChip>
        </>
      }
      description="Formulaire de modification d'une sortie."
      error={state.error}
      submitIcon={EditIcon}
      submitVariant="warning"
      submitLabel="Enregistrer"
    >
      <div className="flex flex-col gap-1.5">
        <FieldLabel
          htmlFor="edit-entreeReference"
          icon={ICONS.reference}
          required
        >
          Référence de l'entrée
        </FieldLabel>
        <div className="flex items-center gap-1.5">
          <InputGroup className="flex-1">
            <InputGroupInput
              id="edit-entreeReference"
              defaultValue={sortie.entreeReference}
              readOnly
              disabled
            />
          </InputGroup>
          <EntreeDetailsDialog
            reference={sortie.entreeReference}
            allowAddSortie={false}
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <FieldLabel htmlFor="edit-nombrePieces" icon={ICONS.pieces} required>
          Nombre de pièces (max {maxNombrePieces})
        </FieldLabel>
        <InputGroup>
          <InputGroupInput
            id="edit-nombrePieces"
            name="nombrePieces"
            type="number"
            min="1"
            max={maxNombrePieces}
            step="1"
            defaultValue={sortie.nombrePieces}
            required
          />
        </InputGroup>
      </div>

      <SortieFormFields mode="edit" {...{ sortie }} />
    </FormDialog>
  );
}
