import { Input } from "@/shadcn/ui/input";
import type { ColumnFilterField, GetFilterField } from "./filtering";
import type { CustomTableLabels } from "./labels";

export function TextFilterContent({
  getField,
  setField,
  labels,
}: {
  getField: GetFilterField;
  setField: (field: ColumnFilterField, value: string) => void;
  labels: CustomTableLabels;
}) {
  return (
    <div className="p-2">
      <Input
        placeholder={labels.search}
        value={getField("search")}
        onChange={(e) => setField("search", e.target.value)}
        className="h-7"
      />
    </div>
  );
}
