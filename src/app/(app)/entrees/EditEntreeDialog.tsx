"use client";

import { Alert02Icon, EditIcon } from "@hugeicons/core-free-icons";
import { useActionState, useState } from "react";
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
import { updateEntree } from "./actions";
import { EntreeFormFields } from "./EntreeFormFields";
import type { EntreeRow } from "./types";

export function EditEntreeDialog({ entree }: { entree: EntreeRow }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(
    async (prevState: { error: string | null }, formData: FormData) => {
      const result = await updateEntree(entree.reference, prevState, formData);
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
          <DialogTitle>Modifier l'entrée</DialogTitle>
          <DialogDescription className="sr-only">
            Formulaire de modification d'une entrée en stock.
          </DialogDescription>
        </DialogHeader>
        <form action={formAction} className="flex flex-col gap-4">
          <EntreeFormFields mode="edit" {...{ entree }} />

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
