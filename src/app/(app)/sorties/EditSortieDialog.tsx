"use client";

import {
  Alert02Icon,
  Calendar04Icon,
  EditIcon,
  HashIcon,
  InvoiceIcon,
} from "@hugeicons/core-free-icons";
import { useActionState, useState } from "react";
import { DatePickerField } from "@/components/DatePickerField";
import { FieldLabel } from "@/components/FieldLabel";
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
import { InputGroup, InputGroupInput } from "@/shadcn/ui/input-group";
import { updateSortie } from "./actions";
import type { SortieRow } from "./types";

export function EditSortieDialog({ sortie }: { sortie: SortieRow }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(
    async (prevState: { error: string | null }, formData: FormData) => {
      const result = await updateSortie(
        sortie.entreeReference,
        prevState,
        formData,
      );
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
            <FieldLabel htmlFor="edit-entreeReference" icon={HashIcon} required>
              Référence de l'entrée
            </FieldLabel>
            <InputGroup>
              <InputGroupInput
                id="edit-entreeReference"
                defaultValue={sortie.entreeReference}
                readOnly
                disabled
              />
            </InputGroup>
          </div>

          <div className="flex flex-col gap-1.5">
            <FieldLabel htmlFor="edit-bonCommande" icon={InvoiceIcon} required>
              Bon de commande
            </FieldLabel>
            <InputGroup>
              <InputGroupInput
                id="edit-bonCommande"
                name="bonCommande"
                defaultValue={sortie.bonCommande}
                placeholder="C928492748"
                required
              />
            </InputGroup>
          </div>

          <div className="flex flex-col gap-1.5">
            <FieldLabel icon={Calendar04Icon} required>
              Date de sortie
            </FieldLabel>
            <DatePickerField
              name="dateSortie"
              defaultValue={sortie.dateSortie}
            />
          </div>

          {state.error && (
            <span className="inline-flex items-center gap-1.5 text-sm text-destructive">
              <Icon icon={Alert02Icon} />
              {state.error}
            </span>
          )}

          <DialogFooter>
            <Button type="submit" variant="warning" disabled={pending}>
              <Icon icon={EditIcon} />
              Enregistrer
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
