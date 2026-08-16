"use client";

import { EditIcon } from "@hugeicons/core-free-icons";
import { useActionState, useState } from "react";
import { FormDialog } from "@/components/FormDialog";
import { Icon } from "@/components/Icon";
import { Button } from "@/shadcn/ui/button";
import { playChime } from "@/utils/sound";
import { updateEntree } from "./actions";
import { EntreeFormFields } from "./EntreeFormFields";
import type { EntreeRow } from "./types";

export function EditEntreeDialog({ entree }: { entree: EntreeRow }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(
    async (prevState: { error: string | null }, formData: FormData) => {
      const result = await updateEntree(entree.reference, prevState, formData);
      if (!result.error) {
        setOpen(false);
        playChime("success");
      }
      return result;
    },
    { error: null },
  );

  return (
    <FormDialog
      {...{ open, formAction, pending }}
      onOpenChange={setOpen}
      trigger={
        <Button variant="warning" size="icon-sm" className="corner-squircle">
          <Icon icon={EditIcon} />
        </Button>
      }
      title="Modifier l'entrée"
      description="Formulaire de modification d'une entrée en stock."
      error={state.error}
      submitIcon={EditIcon}
      submitVariant="warning"
      submitLabel="Enregistrer"
    >
      <EntreeFormFields mode="edit" {...{ entree }} />
    </FormDialog>
  );
}
