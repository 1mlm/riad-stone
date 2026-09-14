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
import type { DesignationSuggestion } from "./actions";

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
  suggestions: DesignationSuggestion[];
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
            className="cursor-pointer"
            {...{ value, placeholder }}
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
                  key={suggestion.designation}
                  value={suggestion.designation}
                  data-checked={suggestion.designation === value}
                  onSelect={select}
                >
                  <span className="flex min-w-0 flex-1 items-center gap-2">
                    <span className="min-w-0 flex-1 truncate">
                      {suggestion.designation}
                    </span>
                    <span className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
                      {suggestion.lotCount} lot
                      {suggestion.lotCount > 1 ? "s" : ""}
                    </span>
                    <span className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
                      <Icon icon={ICONS.pieces} />
                      {suggestion.piecesRestantes}
                    </span>
                  </span>
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
