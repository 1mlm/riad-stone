"use client";

import { EditIcon } from "@hugeicons/core-free-icons";
import { useActionState, useState } from "react";
import { EntreeDetailsDialog } from "@/components/EntreeDetailsDialog";
import { FieldLabel } from "@/components/FieldLabel";
import { FormError } from "@/components/FormError";
import { Icon } from "@/components/Icon";
import { SubmitButton } from "@/components/SubmitButton";
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
  const [open, setOpen] = useState(false);
  // availableEntrees.piecesRestantes already excludes this sortie's own
  // amount — add it back since editing releases it before re-applying
  const maxNombrePieces =
    (availableEntrees.find(
      (entree) => entree.reference === sortie.entreeReference,
    )?.piecesRestantes ?? 0) + sortie.nombrePieces;
  const [state, formAction, pending] = useActionState(
    async (prevState: { error: string | null }, formData: FormData) => {
      const result = await updateSortie(sortie.id, prevState, formData);
      if (!result.error) setOpen(false);
      return result;
    },
    { error: null },
  );

  return (
    <Dialog {...{ open, onOpenChange: setOpen }}>
      <DialogTrigger asChild>
        <Button variant="warning" size="icon-sm" className="corner-squircle">
          <Icon icon={EditIcon} />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Modifier la sortie</DialogTitle>
          <DialogDescription className="sr-only">
            Formulaire de modification d'une sortie.
          </DialogDescription>
        </DialogHeader>
        <form action={formAction} className="flex flex-col gap-4">
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
            <FieldLabel
              htmlFor="edit-nombrePieces"
              icon={ICONS.pieces}
              required
            >
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

          <FormError>{state.error}</FormError>

          <DialogFooter>
            <SubmitButton variant="warning" icon={EditIcon} {...{ pending }}>
              Enregistrer
            </SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
