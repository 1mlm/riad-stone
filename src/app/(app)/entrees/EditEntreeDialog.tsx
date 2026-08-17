"use client";

import { EditIcon } from "@hugeicons/core-free-icons";
import { DialogTitleChip } from "@/components/DialogTitleChip";
import { FormDialog } from "@/components/FormDialog";
import { RowMenuItemButton } from "@/components/table/RowContextMenu";
import { useFormDialogAction } from "@/components/useFormDialogAction";
import { ICONS } from "@/utils/icon";
import { updateEntree } from "./actions";
import { EntreeFormFields } from "./EntreeFormFields";
import type { EntreeRow } from "./types";

export function EditEntreeDialog({ entree }: { entree: EntreeRow }) {
  const { open, setOpen, state, formAction, pending } = useFormDialogAction(
    (prevState, formData) =>
      updateEntree(entree.reference, prevState, formData),
  );

  return (
    <FormDialog
      {...{ open, formAction, pending }}
      onOpenChange={setOpen}
      trigger={<RowMenuItemButton icon={EditIcon}>Modifier</RowMenuItemButton>}
      title={
        <>
          Modifier{" "}
          <DialogTitleChip icon={ICONS.entree}>l'entrée</DialogTitleChip>
        </>
      }
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
