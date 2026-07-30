"use client";

import { ArrowDown01Icon } from "@hugeicons/core-free-icons";
import { useState } from "react";
import { Icon } from "@/components/Icon";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shadcn/ui/dropdown-menu";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/shadcn/ui/input-group";
import { LENGTH_UNITS, type LengthUnit } from "@/utils/length";

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
        min="0"
        {...{ placeholder, defaultValue }}
      />
      <input type="hidden" name={unitName} value={unit} />
      <InputGroupAddon align="inline-end">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <InputGroupButton type="button">
              {unit}
              <Icon icon={ArrowDown01Icon} />
            </InputGroupButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {LENGTH_UNITS.map((option) => (
              <DropdownMenuItem key={option} onClick={() => setUnit(option)}>
                {option}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </InputGroupAddon>
    </InputGroup>
  );
}
