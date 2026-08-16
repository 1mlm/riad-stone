"use client";

import { Calendar04Icon, InvoiceIcon } from "@hugeicons/core-free-icons";
import { DatePickerField } from "@/components/DatePickerField";
import { FieldLabel } from "@/components/FieldLabel";
import { fr } from "@/messages/fr";
import { InputGroup, InputGroupInput } from "@/shadcn/ui/input-group";
import type { SortieRow } from "./types";

export function SortieFormFields({
  mode,
  sortie,
}: {
  mode: "add" | "edit";
  sortie?: SortieRow;
}) {
  const bonCommandeId = mode === "edit" ? "edit-bonCommande" : "bonCommande";

  return (
    <>
      <div className="flex flex-col gap-1.5">
        <FieldLabel htmlFor={bonCommandeId} icon={InvoiceIcon}>
          Bon de commande
        </FieldLabel>
        <InputGroup>
          <InputGroupInput
            id={bonCommandeId}
            name="bonCommande"
            defaultValue={sortie?.bonCommande ?? ""}
            placeholder="C928492748"
            className="font-mono"
          />
        </InputGroup>
      </div>

      <div className="flex flex-col gap-1.5">
        <FieldLabel icon={Calendar04Icon} required>
          Date de sortie
        </FieldLabel>
        <DatePickerField
          name="dateSortie"
          defaultValue={sortie?.dateSortie}
          placeholder={fr.datePicker.placeholder}
          locale={fr.common.locale}
        />
      </div>
    </>
  );
}
