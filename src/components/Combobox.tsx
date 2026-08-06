"use client";

import { ArrowDown01Icon, Search01Icon } from "@hugeicons/core-free-icons";
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
import { ICONS } from "@/utils/icon";

type ComboboxOption = { value: string; label: string };

// a searchable single-select — the trigger is a hidden input carrying `value`
// so it plugs into a plain <form action={serverAction}> the same way a
// native <select>/<input> would, no controlled-form wiring needed upstream
export function Combobox({
  name,
  options,
  value,
  onValueChange,
  placeholder = "Sélectionner...",
  searchPlaceholder = "Rechercher...",
  emptyLabel = "Aucun résultat.",
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
        option.label.toLowerCase().includes(query),
    );
  }, [options, search]);

  const selectedOption = options.find((option) => option.value === value);

  return (
    <Popover
      open={open}
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
          className="w-full justify-between font-normal"
        >
          {selectedOption ? (
            <span className="truncate">
              <span className="font-mono">{selectedOption.value}</span>
              {": "}
              {selectedOption.label}
            </span>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <Icon icon={ArrowDown01Icon} className="text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-(--radix-popover-trigger-width) p-1.5"
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
            <button
              key={option.value}
              type="button"
              onClick={() => {
                onValueChange(option.value);
                setOpen(false);
              }}
              className={cn(
                "flex items-center justify-between gap-2 rounded-sm px-2 py-1.5 text-left text-sm hover:bg-muted",
                option.value === value && "bg-muted",
              )}
            >
              <span className="flex min-w-0 flex-col">
                <span className="truncate font-mono text-xs">
                  {option.value}
                </span>
                <span className="truncate text-xs text-muted-foreground">
                  {option.label}
                </span>
              </span>
              {option.value === value && (
                <Icon icon={ICONS.check} className="shrink-0 text-primary" />
              )}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
