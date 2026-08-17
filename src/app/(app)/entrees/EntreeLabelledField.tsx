import { FieldLabel } from "@/components/FieldLabel";
import { EntreeFieldInput } from "./EntreeFieldInput";
import type { FieldContext } from "./entreeFieldContext";
import { getInputId } from "./entreeFieldContext";
import type { EntreeField } from "./fields";

export function EntreeLabelledField({
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
      <EntreeFieldInput {...{ field, context }} />
    </div>
  );
}
