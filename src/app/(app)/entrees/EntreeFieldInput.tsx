import { DatePickerField } from "@/components/DatePickerField";
import { fr } from "@/messages/fr";
import { InputGroup, InputGroupInput } from "@/shadcn/ui/input-group";
import {
  type FieldContext,
  getInputId,
  getInputName,
} from "./entreeFieldContext";
import type { EntreeField } from "./fields";
import { toDisplayLength } from "./fields";
import { UnitLengthInput } from "./UnitLengthInput";

export function EntreeFieldInput({
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
        placeholder={fr.datePicker.placeholder}
        locale={fr.common.locale}
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
