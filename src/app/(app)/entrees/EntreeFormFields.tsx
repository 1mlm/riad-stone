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

const inputId = (mode: Mode, key: string) =>
  mode === "edit" ? `edit-${key}` : key;

function TextInput({
  field,
  mode,
  entree,
  designationSuggestions,
}: {
  field: Extract<EntreeField, { kind: "text" }>;
  mode: Mode;
  entree?: EntreeRow;
  designationSuggestions?: string[];
}) {
  const id = inputId(mode, field.key);
  const locked = mode === "edit" && field.lockedOnEdit;
  const listId = field.suggestions ? `${field.key}-suggestions` : undefined;
  const defaultValue = entree
    ? ((entree[field.key] as string | null) ?? "")
    : undefined;

  return (
    <>
      <InputGroup className={locked ? "bg-input/50 opacity-70" : undefined}>
        <InputGroupInput
          id={id}
          name={field.key}
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
}: {
  field: EntreeField;
  mode: Mode;
  entree?: EntreeRow;
  designationSuggestions?: string[];
}) {
  if (field.kind === "text")
    return <TextInput {...{ field, mode, entree, designationSuggestions }} />;

  if (field.kind === "date")
    return <DatePickerField name={field.key} defaultValue={entree?.date} />;

  if (field.kind === "unitLength")
    return (
      <UnitLengthInput
        valueName={`${field.key}Value`}
        unitName={`${field.key}Unit`}
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
        id={inputId(mode, field.key)}
        name={field.key}
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
) {
  const id = field.kind === "date" ? undefined : inputId(mode, field.key);

  return (
    <div className="flex flex-col gap-1.5" key={field.key}>
      <FieldLabel htmlFor={id} icon={field.icon} required={field.required}>
        {field.label}
      </FieldLabel>
      <FieldInput {...{ field, mode, entree, designationSuggestions }} />
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
}: {
  mode: Mode;
  entree?: EntreeRow;
  designationSuggestions?: string[];
}) {
  const requiredFields = ENTREE_FIELDS.filter((field) => field.required);
  const optionalFields = ENTREE_FIELDS.filter((field) => !field.required);

  const renderItem = (item: EntreeField | EntreeField[]): ReactNode =>
    Array.isArray(item) ? (
      <div
        key={item.map((f) => f.key).join("-")}
        className="grid grid-cols-2 gap-3"
      >
        {item.map((field) =>
          renderField(field, mode, entree, designationSuggestions),
        )}
      </div>
    ) : (
      renderField(item, mode, entree, designationSuggestions)
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
