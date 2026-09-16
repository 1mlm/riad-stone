"use client";

import { Calendar04Icon } from "@hugeicons/core-free-icons";
import { useState } from "react";
import { Icon } from "@/components/Icon";
import { Calendar } from "@/shadcn/ui/calendar";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/shadcn/ui/input-group";
import { Popover, PopoverContent, PopoverTrigger } from "@/shadcn/ui/popover";
import { haptic } from "@/utils/haptics";

// a controlled sibling of DatePickerField (same Calendar/Popover pieces),
// needed because that one is deliberately uncontrolled (a hidden input for
// a <form>) — the preview needs an onChange it can react to, to recompute
// row validity live, which an uncontrolled field can't give it
export function ImportDateCell({
  value,
  onChange,
  locale,
}: {
  // ISO yyyy-mm-dd, always resolved (see ParsedEntreeRow.date)
  value: string;
  onChange: (isoDate: string) => void;
  locale: string;
}) {
  const [open, setOpen] = useState(false);
  const date = new Date(`${value}T00:00:00`);

  return (
    <Popover {...{ open, onOpenChange: setOpen }}>
      <PopoverTrigger asChild>
        <InputGroup className="w-32 cursor-pointer corner-squircle">
          <InputGroupAddon>
            <Icon icon={Calendar04Icon} />
          </InputGroupAddon>
          <InputGroupInput
            readOnly
            value={date.toLocaleDateString(locale)}
            className="cursor-pointer"
          />
        </InputGroup>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <Calendar
          mode="single"
          selected={date}
          defaultMonth={date}
          onSelect={(picked) => {
            if (!picked) return;
            haptic("selection");
            onChange(
              `${picked.getFullYear()}-${String(picked.getMonth() + 1).padStart(2, "0")}-${String(picked.getDate()).padStart(2, "0")}`,
            );
            setOpen(false);
          }}
        />
      </PopoverContent>
    </Popover>
  );
}
