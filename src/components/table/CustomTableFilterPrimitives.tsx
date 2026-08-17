import { type ReactNode, useId } from "react";
import { Checkbox } from "@/shadcn/ui/checkbox";
import { Input } from "@/shadcn/ui/input";
import { haptic } from "@/utils/haptics";
import type { ColumnFilterField, GetFilterField } from "./filtering";
import { getTriState } from "./filtering";
import type { CustomTableLabels } from "./labels";

// one consistent checkbox+label row, reused by every filter menu (enum options, "select all", tag picks...)
export function CheckboxRow({
  checked,
  onCheckedChange,
  children,
}: {
  checked: boolean | "indeterminate";
  onCheckedChange: () => void;
  children: ReactNode;
}) {
  const id = useId();

  return (
    <label
      htmlFor={id}
      className="flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-muted"
    >
      <Checkbox
        {...{ id, checked }}
        onCheckedChange={() => {
          haptic("selection");
          onCheckedChange();
        }}
      />
      {children}
    </label>
  );
}

export function SelectAllRow({
  selectedCount,
  totalCount,
  onToggle,
  labels,
}: {
  selectedCount: number;
  totalCount: number;
  onToggle: () => void;
  labels: CustomTableLabels;
}) {
  return (
    <CheckboxRow
      checked={getTriState(selectedCount, totalCount)}
      onCheckedChange={onToggle}
    >
      {labels.selectAll}
    </CheckboxRow>
  );
}

// two number inputs sharing one min/max filter pair
export function MinMaxInputs({
  getField,
  setField,
  minField = "min",
  maxField = "max",
  className = "h-7 w-20",
  showToLabel = false,
  labels,
}: {
  getField: GetFilterField;
  setField: (field: ColumnFilterField, value: string) => void;
  minField?: ColumnFilterField;
  maxField?: ColumnFilterField;
  className?: string;
  showToLabel?: boolean;
  labels: CustomTableLabels;
}) {
  return (
    <>
      <Input
        type="number"
        placeholder={labels.min}
        value={getField(minField)}
        onChange={(e) => setField(minField, e.target.value)}
        {...{ className }}
      />
      {showToLabel && (
        <span className="text-muted-foreground text-xs">{labels.to}</span>
      )}
      <Input
        type="number"
        placeholder={labels.max}
        value={getField(maxField)}
        onChange={(e) => setField(maxField, e.target.value)}
        {...{ className }}
      />
    </>
  );
}
