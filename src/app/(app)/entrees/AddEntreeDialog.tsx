"use client";

import { Alert02Icon, PlusSignIcon } from "@hugeicons/core-free-icons";
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
import { createEntree } from "./actions";
import { EntreeFormFields } from "./EntreeFormFields";

export function AddEntreeDialog({
  designationSuggestions,
}: {
  designationSuggestions: string[];
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(
    async (prevState: { error: string | null }, formData: FormData) => {
      const result = await createEntree(prevState, formData);
      if (!result.error) setOpen(false);
      return result;
    },
    { error: null },
  );

  return (
    <Dialog {...{ open, onOpenChange: setOpen }}>
      <DialogTrigger asChild>
        <Button className="rounded-full corner-squircle">
          <Icon icon={PlusSignIcon} />
          Ajouter une entrée
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Ajouter une entrée</DialogTitle>
          <DialogDescription className="sr-only">
            Formulaire d'ajout d'une nouvelle entrée en stock.
          </DialogDescription>
        </DialogHeader>
        <form action={formAction} className="flex flex-col gap-4">
          <EntreeFormFields mode="add" {...{ designationSuggestions }} />

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
