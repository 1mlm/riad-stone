"use client";

import { useState } from "react";
import { Icon } from "@/components/Icon";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/shadcn/ui/command";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/shadcn/ui/input-group";
import { Popover, PopoverContent, PopoverTrigger } from "@/shadcn/ui/popover";
import { haptic } from "@/utils/haptics";
import { ICONS } from "@/utils/icon";

export function DesignationCombobox({
  name,
  value,
  onValueChange,
  suggestions,
  placeholder,
}: {
  name: string;
  value: string;
  onValueChange: (value: string) => void;
  suggestions: string[];
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const select = (next: string) => {
    haptic("selection");
    onValueChange(next);
    setSearch("");
    setOpen(false);
  };

  return (
    <Popover {...{ open, onOpenChange: setOpen }}>
      <PopoverTrigger asChild>
        <InputGroup className="cursor-pointer corner-squircle">
          <InputGroupInput
            readOnly
            value={value}
            className="cursor-pointer"
            {...{ placeholder }}
          />
          <InputGroupAddon align="inline-end">
            <Icon icon={ICONS.chevronDown} className="opacity-50" />
          </InputGroupAddon>
        </InputGroup>
      </PopoverTrigger>
      <PopoverContent className="w-(--radix-popover-trigger-width) p-0">
        <Command>
          <CommandInput
            placeholder="Rechercher ou créer..."
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            <CommandEmpty>
              {search.trim() ? (
                <button
                  type="button"
                  className="flex w-full items-center gap-1.5 px-2 py-1 text-left hover:text-foreground"
                  onClick={() => select(search.trim())}
                >
                  Créer « {search.trim()} »
                </button>
              ) : (
                "Aucun résultat."
              )}
            </CommandEmpty>
            <CommandGroup>
              {suggestions.map((suggestion) => (
                <CommandItem
                  key={suggestion}
                  value={suggestion}
                  data-checked={suggestion === value}
                  onSelect={select}
                >
                  {suggestion}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
      <input type="hidden" {...{ name, value }} />
    </Popover>
  );
}
