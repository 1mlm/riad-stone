import { MinMaxInputs } from "./CustomTableFilterPrimitives";
import type { ColumnFilterField, GetFilterField } from "./filtering";
import type { CustomTableLabels } from "./labels";

export function NumberRangeFilterContent({
  getField,
  setField,
  labels,
}: {
  getField: GetFilterField;
  setField: (field: ColumnFilterField, value: string) => void;
  labels: CustomTableLabels;
}) {
  return (
    <div className="flex items-center gap-1.5 p-2">
      <MinMaxInputs {...{ getField, setField, labels }} showToLabel />
    </div>
  );
}
