"use client";

import { useActionState, useState } from "react";
import { playChime } from "@/utils/sound";

// the open/submit/close-on-success wiring every add/edit FormDialog repeats:
// track open state, run the server action through useActionState, and on
// success close the dialog and play the success chime. onSuccess is for
// per-dialog extras (e.g. AddSortieDialog resetting its picked entrée)
export function useFormDialogAction(
  action: (
    prevState: { error: string | null },
    formData: FormData,
  ) => Promise<{ error: string | null }>,
  onSuccess?: () => void,
) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(
    async (prevState: { error: string | null }, formData: FormData) => {
      const result = await action(prevState, formData);
      if (!result.error) {
        setOpen(false);
        playChime("success");
        onSuccess?.();
      }
      return result;
    },
    { error: null },
  );

  return { open, setOpen, state, formAction, pending };
}
