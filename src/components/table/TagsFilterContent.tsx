import { DropdownMenuSeparator } from "@/shadcn/ui/dropdown-menu";
import { Input } from "@/shadcn/ui/input";
import type { CustomTableColumn } from "./CustomTable";
import {
  CheckboxRow,
  MinMaxInputs,
  SelectAllRow,
} from "./CustomTableFilterPrimitives";
import type { ColumnFilterField, GetFilterField } from "./filtering";
import type { CustomTableLabels } from "./labels";

export function TagsFilterContent<T>({
  column,
  items,
  getField,
  setField,
  labels,
}: {
  column: Extract<CustomTableColumn<T>, { type: "tags" }>;
  items: T[];
  getField: GetFilterField;
  setField: (field: ColumnFilterField, value: string) => void;
  labels: CustomTableLabels;
}) {
  const only = getField("only")
    ? getField("only").split(",").filter(Boolean)
    : [];
  const allLabels = [
    ...new Set(
      items.flatMap((item) => column.getTags(item).map((tag) => tag.label)),
    ),
  ];
  const toggleAll = () =>
    setField(
      "only",
      only.length === allLabels.length ? "" : allLabels.join(","),
    );
  const toggleLabel = (label: string) => {
    const next = only.includes(label)
      ? only.filter((value) => value !== label)
      : [...only, label];
    setField("only", next.join(","));
  };

  return (
    <div className="flex flex-col gap-1 p-1">
      <div className="flex items-center gap-1.5 p-1">
        <span className="text-muted-foreground text-xs">{labels.count}</span>
        <MinMaxInputs
          {...{ getField, setField, labels }}
          minField="countMin"
          maxField="countMax"
          className="h-7 w-16"
        />
      </div>
      <DropdownMenuSeparator />
      <div className="p-1">
        <Input
          placeholder={labels.searchTags}
          value={getField("search")}
          onChange={(e) => setField("search", e.target.value)}
          className="h-7"
        />
      </div>
      <DropdownMenuSeparator />
      <SelectAllRow
        selectedCount={only.length}
        totalCount={allLabels.length}
        onToggle={toggleAll}
        {...{ labels }}
      />
      <DropdownMenuSeparator />
      <div className="flex max-h-48 flex-col gap-0.5 overflow-y-auto p-1">
        {allLabels.map((label) => (
          <CheckboxRow
            key={label}
            checked={only.includes(label)}
            onCheckedChange={() => toggleLabel(label)}
          >
            {label}
          </CheckboxRow>
        ))}
      </div>
    </div>
  );
}
