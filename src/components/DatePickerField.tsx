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
  defaultValue,
}: {
  name: string;
  // left unset (add mode), the field submits empty and the server stamps
  // the current time at submit — not whatever time this field happened to
  // mount at. Edit mode passes the entree's real date, which stays fixed
  // until the user actually touches the picker.
  defaultValue?: Date;
}) {
  const [date, setDate] = useState<Date | undefined>(defaultValue);
  const [open, setOpen] = useState(false);

  // only used to render the calendar/time widgets before the user has
  // picked anything — never written back into `date` on its own
  const displayDate = date ?? new Date();

  return (
    <Popover {...{ open, onOpenChange: setOpen }}>
      <PopoverTrigger asChild>
        <InputGroup className="cursor-pointer corner-squircle">
          <InputGroupAddon>
            <Icon icon={Calendar04Icon} />
          </InputGroupAddon>
          <InputGroupInput
            readOnly
            value={
              date
                ? `${date.toLocaleDateString("fr-FR")} ${dateToTimeInputValue(date)}`
                : ""
            }
            placeholder="Maintenant"
            className="cursor-pointer"
          />
        </InputGroup>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <Calendar
          mode="single"
          selected={date}
          defaultMonth={displayDate}
          onSelect={(value) => {
            if (!value) return;
            setDate((previous) =>
              setDayKeepingTime(value, previous ?? new Date()),
            );
          }}
        />
        <div className="flex items-center gap-1.5 border-t p-3">
          <Icon icon={Clock01Icon} className="text-muted-foreground" />
          <input
            type="time"
            value={dateToTimeInputValue(displayDate)}
            onChange={(event) =>
              setDate((previous) =>
                setTimeFromInputValue(
                  previous ?? new Date(),
                  event.target.value,
                ),
              )
            }
            className="flex-1 rounded-md border bg-transparent px-2 py-1 text-sm outline-none"
          />
        </div>
      </PopoverContent>
      <input
        type="hidden"
        {...{ name }}
        value={date ? date.toISOString() : ""}
      />
    </Popover>
  );
}
