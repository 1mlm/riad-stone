import type { EntreeField } from "./fields";
import type { EntreeRow } from "./types";

// past values for text fields worth suggesting — keyed by field key, only
// populated for fields the caller actually has suggestions for (origine,
// conteneur). Feeds a native <datalist> since the multi-card add form
// namespaces every input's name under a per-card uuid, which defeats the
// browser's own name-based autofill history
export type FieldSuggestions = Partial<Record<EntreeField["key"], string[]>>;

// everything a field renderer needs beyond the field definition itself,
// passed around as one bag so each renderer keeps a two-prop signature
export type FieldContext = {
  mode: "add" | "edit";
  entree?: EntreeRow;
  // namespaces every id/name under this prefix — needed when several
  // EntreeFormFields instances share one <form> (the multi-card add flow)
  namePrefix?: string;
  suggestions?: FieldSuggestions;
};

// with no namePrefix, id/name are the bare field key (single-instance forms:
// add/edit dialogs). With a namePrefix (e.g. a card id in a multi-card
// form), both are namespaced so many instances of the same field can coexist
// in one <form> without colliding.
export function getInputId(key: string, { mode, namePrefix }: FieldContext) {
  if (namePrefix) return `${namePrefix}-${key}`;
  if (mode === "edit") return `edit-${key}`;
  return key;
}

export const getInputName = (key: string, { namePrefix }: FieldContext) =>
  namePrefix ? `${namePrefix}__${key}` : key;
