import { DatePickerField } from "@/components/DatePickerField";
import { SuggestionInput } from "@/components/SuggestionInput";
import { fr } from "@/messages/fr";
import { InputGroup, InputGroupInput } from "@/shadcn/ui/input-group";
import { Textarea } from "@/shadcn/ui/textarea";
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
    const inputProps = {
      id: getInputId(field.key, context),
      name: getInputName(field.key, context),
      type: "text",
      placeholder: field.placeholder,
      defaultValue: entree
        ? ((entree[field.key] as string | null) ?? "")
        : undefined,
      readOnly: locked,
      required: field.required,
    };

    if (fieldSuggestions && !locked)
      return <SuggestionInput suggestions={fieldSuggestions} {...inputProps} />;

    return (
      <InputGroup className={locked ? "bg-input/50 opacity-70" : undefined}>
        <InputGroupInput
          autoComplete={locked ? "off" : "on"}
          className={
            locked ? "cursor-not-allowed text-muted-foreground" : undefined
          }
          {...inputProps}
        />
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

  if (field.kind === "textarea")
    return (
      <Textarea
        id={getInputId(field.key, context)}
        name={getInputName(field.key, context)}
        placeholder={field.placeholder}
        defaultValue={
          entree ? ((entree[field.key] as string | null) ?? "") : undefined
        }
      />
    );

  if (field.kind === "unitLength") {
    const lengthMeters = entree?.[field.key as "longueur" | "largeur"];
    return (
      <UnitLengthInput
        valueName={getInputName(`${field.key}Value`, context)}
        unitName={getInputName(`${field.key}Unit`, context)}
        placeholder="0"
        defaultValue={
          lengthMeters === undefined
            ? undefined
            : Math.round(toDisplayLength(lengthMeters))
        }
      />
    );
  }

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
