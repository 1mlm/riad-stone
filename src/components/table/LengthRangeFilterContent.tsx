import { useState } from "react";
import { UnitDropdown } from "@/components/UnitDropdown";
import { Input } from "@/shadcn/ui/input";
import { type LengthUnit, lengthToMeters, metersToUnit } from "@/utils/length";
import type { ColumnFilterField, GetFilterField } from "./filtering";
import type { CustomTableLabels } from "./labels";

// same min/max pair as NumberRangeFilterContent, but with a unit dropdown —
// the stored min/max stay in the column's own unit (cm), only the displayed
// digits get converted as the user switches units
export function LengthRangeFilterContent({
  getField,
  setField,
  labels,
}: {
  getField: GetFilterField;
  setField: (field: ColumnFilterField, value: string) => void;
  labels: CustomTableLabels;
}) {
  const [unit, setUnit] = useState<LengthUnit>("cm");

  const toDisplay = (storedCm: string) =>
    storedCm ? String(metersToUnit(Number(storedCm) / 100, unit)) : "";
  const toStoredCm = (displayValue: string) =>
    displayValue
      ? String(lengthToMeters(Number(displayValue), unit) * 100)
      : "";

  return (
    <div className="flex flex-col gap-1.5 p-2">
      <div className="flex items-center gap-1.5">
        <span className="text-muted-foreground text-xs">{labels.between}</span>
        <Input
          type="number"
          placeholder={labels.min}
          value={toDisplay(getField("min"))}
          onChange={(e) => setField("min", toStoredCm(e.target.value))}
          className="h-7 w-16"
        />
        <span className="text-muted-foreground text-xs">{labels.and}</span>
        <Input
          type="number"
          placeholder={labels.max}
          value={toDisplay(getField("max"))}
          onChange={(e) => setField("max", toStoredCm(e.target.value))}
          className="h-7 w-16"
        />
      </div>
      <UnitDropdown {...{ unit }} onUnitChange={setUnit} />
    </div>
  );
}
