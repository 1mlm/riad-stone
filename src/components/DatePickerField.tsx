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

export function DatePickerField({
  name,
  defaultValue = new Date(),
}: {
  name: string;
  defaultValue?: Date;
}) {
  const [date, setDate] = useState<Date>(defaultValue);
  const [open, setOpen] = useState(false);

  return (
    <Popover {...{ open, onOpenChange: setOpen }}>
      <PopoverTrigger asChild>
        <InputGroup className="cursor-pointer corner-squircle">
          <InputGroupAddon>
            <Icon icon={Calendar04Icon} />
          </InputGroupAddon>
          <InputGroupInput
            readOnly
            value={date.toLocaleDateString("fr-FR")}
            className="cursor-pointer"
          />
        </InputGroup>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <Calendar
          mode="single"
          selected={date}
          onSelect={(value) => {
            if (!value) return;
            setDate(value);
            setOpen(false);
          }}
        />
      </PopoverContent>
      <input type="hidden" {...{ name }} value={date.toISOString()} />
    </Popover>
  );
}
