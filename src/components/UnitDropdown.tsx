"use client";

import { ArrowDown01Icon } from "@hugeicons/core-free-icons";
import { Icon } from "@/components/Icon";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shadcn/ui/dropdown-menu";
import { InputGroupButton } from "@/shadcn/ui/input-group";
import { haptic } from "@/utils/haptics";
import { LENGTH_UNITS, type LengthUnit } from "@/utils/length";

export function UnitDropdown({
  unit,
  onUnitChange,
}: {
  unit: LengthUnit;
  onUnitChange: (unit: LengthUnit) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <InputGroupButton type="button">
          {unit}
          <Icon icon={ArrowDown01Icon} />
        </InputGroupButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {LENGTH_UNITS.map((option) => (
          <DropdownMenuItem
            key={option}
            onClick={() => {
              haptic("selection");
              onUnitChange(option);
            }}
          >
            {option}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
