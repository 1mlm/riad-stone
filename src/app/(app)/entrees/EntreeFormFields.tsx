"use client";

import { type ReactNode, useState } from "react";
import { DatePickerField } from "@/components/DatePickerField";
import { FieldLabel } from "@/components/FieldLabel";
import { Icon } from "@/components/Icon";
import { InputGroup, InputGroupInput } from "@/shadcn/ui/input-group";
import { Separator } from "@/shadcn/ui/separator";
import { cn } from "@/shadcn/utils";
import { ICONS } from "@/utils/icon";
import { ENTREE_FIELDS, type EntreeField, toDisplayLength } from "./fields";
import type { EntreeRow } from "./types";
import { UnitLengthInput } from "./UnitLengthInput";

// past values for text fields worth suggesting — keyed by field key, only
// populated for fields the caller actually has suggestions for (origine,
// conteneur). Feeds a native <datalist> since the multi-card add form
// namespaces every input's name under a per-card uuid, which defeats the
// browser's own name-based autofill history
type FieldSuggestions = Partial<Record<EntreeField["key"], string[]>>;

// everything a field renderer needs beyond the field definition itself,
// passed around as one bag so each renderer keeps a two-prop signature
type FieldContext = {
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
function getInputId(key: string, { mode, namePrefix }: FieldContext) {
  if (namePrefix) return `${namePrefix}-${key}`;
  if (mode === "edit") return `edit-${key}`;
  return key;
}
const getInputName = (key: string, { namePrefix }: FieldContext) =>
  namePrefix ? `${namePrefix}__${key}` : key;

function FieldInput({
  field,
  context,
}: {
  field: EntreeField;
  context: FieldContext;
}) {
  const { mode, entree, suggestions } = context;

  if (field.kind === "text") {
    const locked = mode === "edit" && field.lockedOnEdit;
    const fieldSuggestions = suggestions?.[field.key];
    const datalistId = fieldSuggestions
      ? `${getInputId(field.key, context)}-suggestions`
      : undefined;
    return (
      <InputGroup className={locked ? "bg-input/50 opacity-70" : undefined}>
        <InputGroupInput
          id={getInputId(field.key, context)}
          name={getInputName(field.key, context)}
          type="text"
          autoComplete={locked ? "off" : "on"}
          list={datalistId}
          placeholder={field.placeholder}
          defaultValue={
            entree ? ((entree[field.key] as string | null) ?? "") : undefined
          }
          readOnly={locked}
          className={
            locked ? "cursor-not-allowed text-muted-foreground" : undefined
          }
          required={field.required}
        />
        {fieldSuggestions && (
          <datalist id={datalistId}>
            {fieldSuggestions.map((value) => (
              <option key={value} {...{ value }} />
            ))}
          </datalist>
        )}
      </InputGroup>
    );
  }

  if (field.kind === "date")
    return (
      <DatePickerField
        name={getInputName(field.key, context)}
        defaultValue={entree?.date}
      />
    );

  if (field.kind === "unitLength")
    return (
      <UnitLengthInput
        valueName={getInputName(`${field.key}Value`, context)}
        unitName={getInputName(`${field.key}Unit`, context)}
        placeholder="0"
        defaultValue={
          entree
            ? Math.round(
                toDisplayLength(entree[field.key as "longueur" | "largeur"]),
              )
            : undefined
        }
      />
    );

  return (
    <InputGroup>
      <InputGroupInput
        id={getInputId(field.key, context)}
        name={getInputName(field.key, context)}
        type="number"
        inputMode="numeric"
        min="1"
        step="1"
        required={field.required}
        defaultValue={entree?.nombrePieces}
      />
    </InputGroup>
  );
}

function LabelledField({
  field,
  context,
}: {
  field: EntreeField;
  context: FieldContext;
}) {
  // a date field is a popover trigger, not an input a label can focus by id
  const htmlFor =
    field.kind === "date" ? undefined : getInputId(field.key, context);

  return (
    <div className="flex flex-col gap-1.5">
      <FieldLabel {...{ htmlFor }} icon={field.icon} required={field.required}>
        {field.label}
      </FieldLabel>
      <FieldInput {...{ field, context }} />
    </div>
  );
}

// consecutive fields sharing a `group` render side by side in one grid row
function groupFields(
  fields: readonly EntreeField[],
): (EntreeField | EntreeField[])[] {
  const result: (EntreeField | EntreeField[])[] = [];
  for (const field of fields) {
    const last = result[result.length - 1];
    const lastGroup = Array.isArray(last) ? last[0]?.group : undefined;
    if (field.group && lastGroup === field.group)
      (last as EntreeField[]).push(field);
    else result.push(field.group ? [field] : field);
  }
  return result;
}

export function EntreeFormFields({
  mode,
  entree,
  namePrefix,
  excludeKeys,
  suggestions,
}: FieldContext & { excludeKeys?: EntreeField["key"][] }) {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const context = { mode, entree, namePrefix, suggestions };
  const fields: EntreeField[] = ENTREE_FIELDS.filter(
    (field) => !excludeKeys?.includes(field.key),
  );
  const requiredFields = fields.filter((field) => field.required);
  const visibleOptionalFields = fields.filter(
    (field) => !field.required && !field.collapsedByDefault,
  );
  const collapsedFields = fields.filter(
    (field) => !field.required && field.collapsedByDefault,
  );

  const renderItem = (item: EntreeField | EntreeField[]): ReactNode =>
    Array.isArray(item) ? (
      <div
        key={item.map((f) => f.key).join("-")}
        className="grid grid-cols-2 gap-3"
      >
        {item.map((field) => (
          <LabelledField key={field.key} {...{ field, context }} />
        ))}
      </div>
    ) : (
      <LabelledField key={item.key} field={item} {...{ context }} />
    );

  return (
    <>
      {groupFields(requiredFields).map(renderItem)}
      {groupFields(visibleOptionalFields).map(renderItem)}
      {collapsedFields.length > 0 && (
        <>
          <Separator />
          <button
            type="button"
            onClick={() => setDetailsOpen((open) => !open)}
            className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
          >
            Détails supplémentaires
            <Icon
              icon={ICONS.chevronDown}
              className={cn(
                "size-3.5 transition-transform",
                detailsOpen && "rotate-180",
              )}
            />
          </button>
          {detailsOpen && groupFields(collapsedFields).map(renderItem)}
        </>
      )}
    </>
  );
}
