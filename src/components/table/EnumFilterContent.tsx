import { Icon } from "@/components/Icon";
import { DropdownMenuSeparator } from "@/shadcn/ui/dropdown-menu";
import { ICONS } from "@/utils/icon";
import type { CustomTableColumn } from "./CustomTable";
import { CheckboxRow, SelectAllRow } from "./CustomTableFilterPrimitives";
import { EnumBadge } from "./EnumBadge";
import {
  type ColumnFilterField,
  ENUM_FILTER_NONE_KEY,
  type GetFilterField,
  isEnumOptionExcluded,
  toggleEnumOption,
} from "./filtering";
import type { CustomTableLabels } from "./labels";

export function EnumFilterContent<T>({
  column,
  getField,
  setField,
  labels,
}: {
  column: Extract<CustomTableColumn<T>, { type: "enum" }>;
  getField: GetFilterField;
  setField: (field: ColumnFilterField, value: string) => void;
  labels: CustomTableLabels;
}) {
  const options = Object.entries(column.enumOptions);
  const allKeys = [...options.map(([key]) => key), ENUM_FILTER_NONE_KEY];
  const toggle = (key: string) =>
    setField("excluded", toggleEnumOption(getField, key));

  const includedCount = allKeys.filter(
    (key) => !isEnumOptionExcluded(getField, key),
  ).length;
  const toggleAll = () =>
    setField(
      "excluded",
      includedCount === allKeys.length ? allKeys.join(",") : "",
    );

  return (
    <div className="flex flex-col gap-1 p-1">
      <SelectAllRow
        selectedCount={includedCount}
        totalCount={allKeys.length}
        onToggle={toggleAll}
        {...{ labels }}
      />
      <DropdownMenuSeparator />
      {options.map(([key, value]) => (
        <CheckboxRow
          key={key}
          checked={!isEnumOptionExcluded(getField, key)}
          onCheckedChange={() => toggle(key)}
        >
          <EnumBadge {...{ value }} />
        </CheckboxRow>
      ))}
      <CheckboxRow
        checked={!isEnumOptionExcluded(getField, ENUM_FILTER_NONE_KEY)}
        onCheckedChange={() => toggle(ENUM_FILTER_NONE_KEY)}
      >
        <Icon icon={ICONS.cancel} className="size-3.5 opacity-50" />
        <span className="text-sm">{labels.noValue}</span>
      </CheckboxRow>
    </div>
  );
}
