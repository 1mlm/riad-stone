"use client";

import {
  Alert02Icon,
  Calendar04Icon,
  EditIcon,
  InvoiceIcon,
  PlusSignIcon,
} from "@hugeicons/core-free-icons";
import { useActionState, useMemo, useState } from "react";
import { Combobox } from "@/components/Combobox";
import { DatePickerField } from "@/components/DatePickerField";
import { EntreeDetailsDialog } from "@/components/EntreeDetailsDialog";
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
          label: `${entree.designation} — ${entree.piecesRestantes} pièce(s) restante(s)`,
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
      <EntreeDetailsDialog reference={entreeReference} />
    </div>
  );
}

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

  const selectedEntree = useMemo(
    () =>
      availableEntrees.find((entree) => entree.reference === entreeReference),
    [availableEntrees, entreeReference],
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
