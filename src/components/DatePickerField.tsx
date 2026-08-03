"use client";

import { Calendar04Icon, Clock01Icon } from "@hugeicons/core-free-icons";
import { useState } from "react";
import { Icon } from "@/components/Icon";
import { Calendar } from "@/shadcn/ui/calendar";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/shadcn/ui/input-group";
import { Popover, PopoverContent, PopoverTrigger } from "@/shadcn/ui/popover";

const setDayKeepingTime = (day: Date, previous: Date) => {
  const next = new Date(day);
  next.setHours(
    previous.getHours(),
    previous.getMinutes(),
    previous.getSeconds(),
    previous.getMilliseconds(),
  );
  return next;
};

const dateToTimeInputValue = (date: Date) =>
  `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;

const setTimeFromInputValue = (date: Date, timeValue: string) => {
  const [hours, minutes] = timeValue.split(":").map(Number);
  const next = new Date(date);
  next.setHours(hours, minutes, 0, 0);
  return next;
};

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
            value={`${date.toLocaleDateString("fr-FR")} ${dateToTimeInputValue(date)}`}
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
            setDate((previous) => setDayKeepingTime(value, previous));
          }}
        />
        <div className="flex items-center gap-1.5 border-t p-3">
          <Icon icon={Clock01Icon} className="text-muted-foreground" />
          <input
            type="time"
            value={dateToTimeInputValue(date)}
            onChange={(event) =>
              setDate((previous) =>
                setTimeFromInputValue(previous, event.target.value),
              )
            }
            className="flex-1 rounded-md border bg-transparent px-2 py-1 text-sm outline-none"
          />
        </div>
      </PopoverContent>
      <input type="hidden" {...{ name }} value={date.toISOString()} />
    </Popover>
  );
}
