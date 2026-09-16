"use client";

import { Calendar04Icon, InvoiceIcon } from "@hugeicons/core-free-icons";
import type { ReactNode } from "react";
import { DatePickerField } from "@/components/DatePickerField";
import { FieldLabel } from "@/components/FieldLabel";
import { fr } from "@/messages/fr";
import { InputGroup, InputGroupInput } from "@/shadcn/ui/input-group";
import { Textarea } from "@/shadcn/ui/textarea";
import { ICONS } from "@/utils/icon";
import type { SortieCardValues } from "./types";

// namespaces every id/name under a card id when several SortieFormFields
// instances share one <form> (the multi-fiche add flow) — with no
// namePrefix (the single-instance edit dialog), falls back to an
// `edit-`-prefixed id so it can't collide with the add dialog's own ids.
// Same reasoning as entrees/entreeFieldContext.ts, just inlined here since
// sorties only has these four fields, not a whole data-driven field list
function namespaced(key: string, namePrefix: string | undefined) {
  return {
    id: namePrefix ? `${namePrefix}-${key}` : `edit-${key}`,
    name: namePrefix ? `${namePrefix}__${key}` : key,
  };
}

export function SortieFormFields({
  sortie,
  namePrefix,
  maxPieces,
  fieldSuggestions,
  entreePicker,
}: {
  sortie?: Partial<SortieCardValues>;
  // the fiche's own entrée multi-select, rendered above its fields — only
  // the add flow has one, the edit dialog shows the sortie's fixed entrée
  // outside this component instead
  entreePicker?: ReactNode;
  // namespaces this instance's fields — set when several fiches share one
  // <form> (the multi-fiche add flow), left unset for the single-fiche edit
  // dialog
  namePrefix?: string;
  // the entrée's pieces restantes — caps how many this one fiche can take.
  // Several fiches in the same submission can each go up to this; the
  // server validates their sum against the real remaining stock
  maxPieces?: number;
  // past bonCommande values, offered as a <datalist> — the multi-fiche form
  // namespaces every field under a per-fiche id, which defeats the
  // browser's own name-based autofill history, same reasoning as
  // entrees' origine/conteneur suggestions
  fieldSuggestions?: { bonCommande: string[] };
}) {
  const nombrePieces = namespaced("nombrePieces", namePrefix);
  const dateSortie = namespaced("dateSortie", namePrefix);
  const bonCommande = namespaced("bonCommande", namePrefix);
  const commentaire = namespaced("commentaire", namePrefix);

  return (
    <>
      {entreePicker}
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <FieldLabel htmlFor={nombrePieces.id} icon={ICONS.pieces} required>
            Nombre de pièces
            {maxPieces !== undefined && ` (max ${maxPieces})`}
          </FieldLabel>
          <InputGroup>
            <InputGroupInput
              id={nombrePieces.id}
              name={nombrePieces.name}
              type="number"
              min="1"
              max={maxPieces}
              step="1"
              disabled={maxPieces === undefined}
              defaultValue={sortie?.nombrePieces}
              required
            />
          </InputGroup>
        </div>

        <div className="flex flex-col gap-1.5">
          <FieldLabel htmlFor={dateSortie.id} icon={Calendar04Icon} required>
            Date de sortie
          </FieldLabel>
          <DatePickerField
            name={dateSortie.name}
            defaultValue={sortie?.dateSortie}
            placeholder={fr.datePicker.placeholder}
            locale={fr.common.locale}
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <FieldLabel htmlFor={bonCommande.id} icon={InvoiceIcon}>
          Bon de commande
        </FieldLabel>
        <InputGroup>
          <InputGroupInput
            id={bonCommande.id}
            name={bonCommande.name}
            defaultValue={sortie?.bonCommande ?? ""}
            placeholder="C928492748"
            list={
              fieldSuggestions?.bonCommande.length
                ? `${bonCommande.id}-suggestions`
                : undefined
            }
            className="font-mono"
          />
        </InputGroup>
        {Boolean(fieldSuggestions?.bonCommande.length) && (
          <datalist id={`${bonCommande.id}-suggestions`}>
            {fieldSuggestions?.bonCommande.map((value) => (
              <option key={value} {...{ value }} />
            ))}
          </datalist>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <FieldLabel htmlFor={commentaire.id} icon={ICONS.commentaire}>
          Commentaire
        </FieldLabel>
        <Textarea
          id={commentaire.id}
          name={commentaire.name}
          defaultValue={sortie?.commentaire ?? ""}
          placeholder="Notes, remarques..."
        />
      </div>
    </>
  );
}
