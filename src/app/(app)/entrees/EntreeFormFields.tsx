"use client";

import type { ReactNode } from "react";
import { DatePickerField } from "@/components/DatePickerField";
import { FieldLabel } from "@/components/FieldLabel";
import { InputGroup, InputGroupInput } from "@/shadcn/ui/input-group";
import { Separator } from "@/shadcn/ui/separator";
import { ENTREE_FIELDS, type EntreeField, toDisplayLength } from "./fields";
import type { EntreeRow } from "./types";
import { UnitLengthInput } from "./UnitLengthInput";

type Mode = "add" | "edit";

// with no namePrefix, id/name are the bare field key (single-instance forms:
// add/edit dialogs). With a namePrefix (e.g. a card id in a multi-card
// form), both are namespaced so many instances of the same field can coexist
// in one <form> without colliding.
const inputId = (mode: Mode, key: string, namePrefix?: string) =>
  namePrefix ? `${namePrefix}-${key}` : mode === "edit" ? `edit-${key}` : key;
const inputName = (key: string, namePrefix?: string) =>
  namePrefix ? `${namePrefix}__${key}` : key;

function TextInput({
  field,
  mode,
  entree,
  designationSuggestions,
  namePrefix,
}: {
  field: Extract<EntreeField, { kind: "text" }>;
  mode: Mode;
  entree?: EntreeRow;
  designationSuggestions?: string[];
  namePrefix?: string;
}) {
  const id = inputId(mode, field.key, namePrefix);
  const locked = mode === "edit" && field.lockedOnEdit;
  const listId = field.suggestions
    ? `${inputId(mode, field.key, namePrefix)}-suggestions`
    : undefined;
  const defaultValue = entree
    ? ((entree[field.key] as string | null) ?? "")
    : undefined;

  return (
    <>
      <InputGroup className={locked ? "bg-input/50 opacity-70" : undefined}>
        <InputGroupInput
          id={id}
          name={inputName(field.key, namePrefix)}
          list={listId}
          placeholder={field.placeholder}
          defaultValue={defaultValue}
          readOnly={locked}
          className={
            locked ? "cursor-not-allowed text-muted-foreground" : undefined
          }
          required={field.required}
        />
      </InputGroup>
      {listId && (
        <datalist id={listId}>
          {designationSuggestions?.map((value) => (
            <option key={value} value={value} />
          ))}
        </datalist>
      )}
    </>
  );
}

function FieldInput({
  field,
  mode,
  entree,
  designationSuggestions,
  namePrefix,
}: {
  field: EntreeField;
  mode: Mode;
  entree?: EntreeRow;
  designationSuggestions?: string[];
  namePrefix?: string;
}) {
  if (field.kind === "text")
    return (
      <TextInput
        {...{ field, mode, entree, designationSuggestions, namePrefix }}
      />
    );

  if (field.kind === "date")
    return (
      <DatePickerField
        name={inputName(field.key, namePrefix)}
        defaultValue={entree?.date}
      />
    );

  if (field.kind === "unitLength")
    return (
      <UnitLengthInput
        valueName={inputName(`${field.key}Value`, namePrefix)}
        unitName={inputName(`${field.key}Unit`, namePrefix)}
        placeholder="0"
        defaultValue={
          entree
            ? toDisplayLength(entree[field.key as "longueur" | "largeur"])
            : undefined
        }
      />
    );

  return (
    <InputGroup>
      <InputGroupInput
        id={inputId(mode, field.key, namePrefix)}
        name={inputName(field.key, namePrefix)}
        type="number"
        min="1"
        step="1"
        required={field.required}
        defaultValue={entree?.nombrePieces}
      />
    </InputGroup>
  );
}

function renderField(
  field: EntreeField,
  mode: Mode,
  entree: EntreeRow | undefined,
  designationSuggestions: string[] | undefined,
  namePrefix: string | undefined,
) {
  const id =
    field.kind === "date" ? undefined : inputId(mode, field.key, namePrefix);

  return (
    <div className="flex flex-col gap-1.5" key={field.key}>
      <FieldLabel htmlFor={id} icon={field.icon} required={field.required}>
        {field.label}
      </FieldLabel>
      <FieldInput
        {...{ field, mode, entree, designationSuggestions, namePrefix }}
      />
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
  designationSuggestions,
  namePrefix,
  excludeKeys,
}: {
  mode: Mode;
  entree?: EntreeRow;
  designationSuggestions?: string[];
  // namespaces every id/name under this prefix — needed when several
  // EntreeFormFields instances share one <form> (the multi-card add flow)
  namePrefix?: string;
  excludeKeys?: EntreeField["key"][];
}) {
  const fields = ENTREE_FIELDS.filter(
    (field) => !excludeKeys?.includes(field.key),
  );
  const requiredFields = fields.filter((field) => field.required);
  const optionalFields = fields.filter((field) => !field.required);

  const renderItem = (item: EntreeField | EntreeField[]): ReactNode =>
    Array.isArray(item) ? (
      <div
        key={item.map((f) => f.key).join("-")}
        className="grid grid-cols-2 gap-3"
      >
        {item.map((field) =>
          renderField(field, mode, entree, designationSuggestions, namePrefix),
        )}
      </div>
    ) : (
      renderField(item, mode, entree, designationSuggestions, namePrefix)
    );

  return (
    <>
      {groupFields(requiredFields).map(renderItem)}
      {optionalFields.length > 0 && (
        <>
          <Separator />
          {groupFields(optionalFields).map(renderItem)}
        </>
      )}
    </>
  );
}
