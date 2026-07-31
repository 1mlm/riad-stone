"use client";

import {
  Alert02Icon,
  Calendar04Icon,
  InvoiceIcon,
  PlusSignIcon,
} from "@hugeicons/core-free-icons";
import { useActionState, useState } from "react";
import { Combobox } from "@/components/Combobox";
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
import { ICONS } from "@/utils/icon";
import { createSortie } from "./actions";
import type { AvailableEntree } from "./types";

export function AddSortieDialog({
  availableEntrees,
}: {
  availableEntrees: AvailableEntree[];
}) {
  const [open, setOpen] = useState(false);
  const [entreeReference, setEntreeReference] = useState("");
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

  return (
    <Dialog {...{ open, onOpenChange: setOpen }}>
      <DialogTrigger asChild>
        <Button className="rounded-full corner-squircle">
          <Icon icon={PlusSignIcon} />
          Ajouter une sortie
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Ajouter une sortie</DialogTitle>
          <DialogDescription className="sr-only">
            Formulaire de sortie d'une entrée en stock.
          </DialogDescription>
        </DialogHeader>
        <form action={formAction} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <FieldLabel icon={ICONS.reference} required>
              Référence de l'entrée
            </FieldLabel>
            <Combobox
              name="entreeReference"
              value={entreeReference}
              onValueChange={setEntreeReference}
              options={availableEntrees.map((entree) => ({
                value: entree.reference,
                label: entree.designation,
              }))}
              placeholder="Sélectionner une entrée..."
              searchPlaceholder="Rechercher une référence..."
              emptyLabel="Aucune entrée disponible."
              required
              ariaInvalid={Boolean(state.error) && !entreeReference}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <FieldLabel htmlFor="bonCommande" icon={InvoiceIcon}>
              Bon de commande
            </FieldLabel>
            <InputGroup>
              <InputGroupInput
                id="bonCommande"
                name="bonCommande"
                placeholder="C928492748"
              />
            </InputGroup>
          </div>

          <div className="flex flex-col gap-1.5">
            <FieldLabel icon={Calendar04Icon} required>
              Date de sortie
            </FieldLabel>
            <DatePickerField name="dateSortie" />
          </div>

          {state.error && (
            <span className="inline-flex items-center gap-1.5 text-sm text-destructive">
              <Icon icon={Alert02Icon} />
              {state.error}
            </span>
          )}

          <DialogFooter>
            <Button type="submit" disabled={pending}>
              <Icon icon={PlusSignIcon} />
              Ajouter
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
