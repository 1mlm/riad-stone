"use client";

import { ArrowDown01Icon, Search01Icon } from "@hugeicons/core-free-icons";
import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import { Icon } from "@/components/Icon";
import { Button } from "@/shadcn/ui/button";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/shadcn/ui/input-group";
import { Popover, PopoverContent, PopoverTrigger } from "@/shadcn/ui/popover";
import { cn } from "@/shadcn/utils";
import { haptic } from "@/utils/haptics";
import { ICONS } from "@/utils/icon";

type ComboboxOption = {
  value: string;
  // separate from content since content can be arbitrary JSX (icons, muted
  // sub-values, ...) that doesn't reduce to one clean string to search
  searchText: string;
  content: ReactNode;
};

// a searchable single-select — the trigger is a hidden input carrying `value`
// so it plugs into a plain <form action={serverAction}> the same way a
// native <select>/<input> would, no controlled-form wiring needed upstream
export function Combobox({
  name,
  options,
  value,
  onValueChange,
  placeholder = "Select...",
  searchPlaceholder = "Search...",
  emptyLabel = "No results.",
  required,
  ariaInvalid,
}: {
  name: string;
  options: ComboboxOption[];
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyLabel?: string;
  required?: boolean;
  ariaInvalid?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filteredOptions = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return options;
    return options.filter(
      (option) =>
        option.value.toLowerCase().includes(query) ||
        option.searchText.toLowerCase().includes(query),
    );
  }, [options, search]);

  const selectedOption = options.find((option) => option.value === value);

  const selectOption = (optionValue: string) => {
    haptic("selection");
    onValueChange(optionValue);
    setOpen(false);
  };

  return (
    <Popover
      {...{ open }}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (nextOpen) setSearch("");
      }}
    >
      <input type="hidden" {...{ name, value, required }} readOnly />
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          aria-invalid={ariaInvalid}
          className="w-full justify-between corner-squircle font-normal"
        >
          {selectedOption ? (
            <span className="min-w-0 flex-1 truncate text-left">
              {selectedOption.content}
            </span>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <Icon
            icon={ArrowDown01Icon}
            className="shrink-0 text-muted-foreground"
          />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-(--radix-popover-trigger-width) corner-squircle p-1.5"
      >
        <InputGroup className="mb-1.5">
          <InputGroupAddon>
            <Icon icon={Search01Icon} />
          </InputGroupAddon>
          <InputGroupInput
            autoFocus
            placeholder={searchPlaceholder}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </InputGroup>
        <div className="flex max-h-56 flex-col overflow-y-auto">
          {filteredOptions.length === 0 && (
            <span className="px-2 py-1.5 text-sm text-muted-foreground">
              {emptyLabel}
            </span>
          )}
          {filteredOptions.map((option) => (
            // a <button> here would block drag-to-select text inside it —
            // browsers suppress native text-selection drags that start on a
            // form control, so a plain clickable div is used instead to keep
            // option text (e.g. a reference to copy) selectable
            <div
              key={option.value}
              role="option"
              aria-selected={option.value === value}
              tabIndex={0}
              onClick={(event) => {
                // a mouseup completing where mousedown started still fires
                // a click even when the gesture in between was a text-select
                // drag — bail out so dragging to copy doesn't also select
                // the option out from under you. Scoped to this row (not
                // "any selection on the page") so an unrelated leftover
                // selection elsewhere doesn't block a normal click here
                const selection = window.getSelection();
                if (
                  selection &&
                  selection.toString().length > 0 &&
                  selection.anchorNode &&
                  event.currentTarget.contains(selection.anchorNode)
                )
                  return;
                selectOption(option.value);
              }}
              onKeyDown={(event) => {
                if (event.key !== "Enter" && event.key !== " ") return;
                event.preventDefault();
                selectOption(option.value);
              }}
              className={cn(
                "flex cursor-pointer items-center justify-between gap-2 rounded-sm px-2 py-1.5 text-sm outline-hidden hover:bg-muted focus-visible:bg-muted",
                option.value === value && "bg-muted",
              )}
            >
              <span className="min-w-0 flex-1">{option.content}</span>
              {option.value === value && (
                <Icon icon={ICONS.check} className="shrink-0 text-primary" />
              )}
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
