"use client";

import { useState } from "react";
import { UnitDropdown } from "@/components/UnitDropdown";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/shadcn/ui/input-group";
import type { LengthUnit } from "@/utils/length";

export function UnitLengthInput({
  valueName,
  unitName,
  placeholder,
  defaultUnit = "cm",
  defaultValue,
}: {
  valueName: string;
  unitName: string;
  placeholder: string;
  defaultUnit?: LengthUnit;
  defaultValue?: number;
}) {
  const [unit, setUnit] = useState<LengthUnit>(defaultUnit);

  return (
    <InputGroup>
      <InputGroupInput
        name={valueName}
        type="number"
        step="any"
        min="0.01"
        {...{ placeholder, defaultValue }}
      />
      <input type="hidden" name={unitName} value={unit} />
      <InputGroupAddon align="inline-end">
        <UnitDropdown {...{ unit }} onUnitChange={setUnit} />
      </InputGroupAddon>
    </InputGroup>
  );
}
