import { Icon } from "@/components/Icon";
import { DropdownMenuSeparator } from "@/shadcn/ui/dropdown-menu";
import { ICONS } from "@/utils/icon";
import { CheckboxRow, SelectAllRow } from "./CustomTableFilterPrimitives";
import {
  type ColumnFilterField,
  type GetFilterField,
  isEnumOptionExcluded,
  toggleEnumOption,
} from "./filtering";
import type { CustomTableLabels } from "./labels";

// same "excluded" toggle mechanism as the enum filter, fixed to the two keys "true"/"false"
export function BooleanFilterContent({
  getField,
  setField,
  labels,
}: {
  getField: GetFilterField;
  setField: (field: ColumnFilterField, value: string) => void;
  labels: CustomTableLabels;
}) {
  const keys = ["true", "false"];
  const toggle = (key: string) =>
    setField("excluded", toggleEnumOption(getField, key));
  const includedCount = keys.filter(
    (key) => !isEnumOptionExcluded(getField, key),
  ).length;
  const toggleAll = () =>
    setField("excluded", includedCount === keys.length ? keys.join(",") : "");

  return (
    <div className="flex flex-col gap-1 p-1">
      <SelectAllRow
        selectedCount={includedCount}
        totalCount={keys.length}
        onToggle={toggleAll}
        {...{ labels }}
      />
      <DropdownMenuSeparator />
      <CheckboxRow
        checked={!isEnumOptionExcluded(getField, "true")}
        onCheckedChange={() => toggle("true")}
      >
        <Icon icon={ICONS.check} className="size-3.5 text-green-500" />
        <span className="text-sm">{labels.yes}</span>
      </CheckboxRow>
      <CheckboxRow
        checked={!isEnumOptionExcluded(getField, "false")}
        onCheckedChange={() => toggle("false")}
      >
        <Icon icon={ICONS.cancel} className="size-3.5 opacity-50" />
        <span className="text-sm">{labels.no}</span>
      </CheckboxRow>
    </div>
  );
}
