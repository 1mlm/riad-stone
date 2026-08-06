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

// the calendar picks/highlights days using local-midnight Date objects, but
// the server stores/returns UTC-midnight dates (a plain DATE column) — going
// straight from one to the other through toISOString()/new Date() shifts the
// day by one for any viewer not in UTC+0, so we convert explicitly at both
// boundaries instead and keep local-midnight as the only value the calendar ever sees
const utcDateToLocalMidnight = (date: Date) =>
  new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());

const localMidnightToUtcIsoDate = (date: Date) =>
  new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()),
  ).toISOString();

export function DatePickerField({
  name,
  defaultValue,
}: {
  name: string;
  // left unset (add mode), the field submits empty and the server stamps
  // the current date at submit — not whatever date this field happened to
  // mount at. Edit mode passes the entree's real date, which stays fixed
  // until the user actually touches the picker.
  defaultValue?: Date;
}) {
  const [date, setDate] = useState<Date | undefined>(
    defaultValue ? utcDateToLocalMidnight(defaultValue) : undefined,
  );
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
            value={date ? date.toLocaleDateString("fr-FR") : ""}
            placeholder="Maintenant"
            className="cursor-pointer"
          />
        </InputGroup>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <Calendar
          mode="single"
          selected={date}
          defaultMonth={date ?? new Date()}
          onSelect={(value) => {
            if (!value) return;
            haptic("selection");
            setDate(value);
            setOpen(false);
          }}
        />
      </PopoverContent>
      <input
        type="hidden"
        {...{ name }}
        value={date ? localMidnightToUtcIsoDate(date) : ""}
      />
    </Popover>
  );
}
