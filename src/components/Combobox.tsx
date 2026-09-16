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
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
  PopoverTrigger,
} from "@/shadcn/ui/popover";
import { cn } from "@/shadcn/utils";
import { haptic } from "@/utils/haptics";
import { ICONS } from "@/utils/icon";

export type ComboboxOption = {
  value: string;
  // separate from content since content can be arbitrary JSX (icons, muted
  // sub-values, ...) that doesn't reduce to one clean string to search
  searchText: string;
  content: ReactNode;
  // compact version shown once picked, in MultiCombobox's chips — the full
  // `content` row is too wide to sit in a chip. Falls back to the value
  chipContent?: ReactNode;
};

function filterOptions(options: ComboboxOption[], search: string) {
  const query = search.trim().toLowerCase();
  if (!query) return options;
  return options.filter(
    (option) =>
      option.value.toLowerCase().includes(query) ||
      option.searchText.toLowerCase().includes(query),
  );
}

// the search box + option rows, shared by the single- and multi-select
// comboboxes — they only differ in their trigger and in what selecting does
function ComboboxPanel({
  options,
  isSelected,
  onSelect,
  searchPlaceholder,
  emptyLabel,
}: {
  options: ComboboxOption[];
  isSelected: (value: string) => boolean;
  onSelect: (value: string) => void;
  searchPlaceholder: string;
  emptyLabel: string;
}) {
  const [search, setSearch] = useState("");
  const filteredOptions = useMemo(
    () => filterOptions(options, search),
    [options, search],
  );

  return (
    <>
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
            aria-selected={isSelected(option.value)}
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
              onSelect(option.value);
            }}
            onKeyDown={(event) => {
              if (event.key !== "Enter" && event.key !== " ") return;
              event.preventDefault();
              onSelect(option.value);
            }}
            className={cn(
              "flex cursor-pointer items-center justify-between gap-2 rounded-sm px-2 py-1.5 text-sm outline-hidden hover:bg-muted focus-visible:bg-muted",
              isSelected(option.value) && "bg-muted",
            )}
          >
            <span className="min-w-0 flex-1">{option.content}</span>
            {isSelected(option.value) && (
              <Icon icon={ICONS.check} className="shrink-0 text-primary" />
            )}
          </div>
        ))}
      </div>
    </>
  );
}

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
  const selectedOption = options.find((option) => option.value === value);

  return (
    <Popover {...{ open }} onOpenChange={setOpen}>
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
        <ComboboxPanel
          {...{ options, searchPlaceholder, emptyLabel }}
          isSelected={(optionValue) => optionValue === value}
          onSelect={(optionValue) => {
            haptic("selection");
            onValueChange(optionValue);
            setOpen(false);
          }}
        />
      </PopoverContent>
    </Popover>
  );
}

// the multi-select flavour: picked values stay as removable chips in the
// field and the popover stays open so several can be picked in a row. Emits
// one hidden input per value, so the server reads them with formData.getAll
export function MultiCombobox({
  name,
  options,
  values,
  onValuesChange,
  placeholder = "Select...",
  addMoreLabel = "Ajouter...",
  searchPlaceholder = "Search...",
  emptyLabel = "No results.",
  ariaInvalid,
}: {
  name: string;
  options: ComboboxOption[];
  values: string[];
  onValuesChange: (values: string[]) => void;
  placeholder?: string;
  addMoreLabel?: string;
  searchPlaceholder?: string;
  emptyLabel?: string;
  ariaInvalid?: boolean;
}) {
  const [open, setOpen] = useState(false);

  const toggleValue = (optionValue: string) => {
    haptic("selection");
    onValuesChange(
      values.includes(optionValue)
        ? values.filter((v) => v !== optionValue)
        : [...values, optionValue],
    );
  };

  return (
    <Popover {...{ open }} onOpenChange={setOpen}>
      {values.map((value) => (
        <input key={value} type="hidden" {...{ name, value }} readOnly />
      ))}
      {/* anchored on the whole field rather than the trigger button so the
          popover lines up with (and matches the width of) the chips row.
          Not a <button> wrapping the chips either: each chip needs its own
          remove button, and a button inside a button is invalid HTML that
          swallows clicks */}
      <PopoverAnchor asChild>
        <div
          aria-invalid={ariaInvalid}
          className="flex min-h-8 w-full flex-wrap items-center gap-1 rounded-lg corner-squircle border border-input p-1 transition-colors aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 has-[button:focus-visible]:border-ring has-[button:focus-visible]:ring-3 has-[button:focus-visible]:ring-ring/50 dark:bg-input/30"
        >
          {values.map((value) => (
            <span
              key={value}
              className="flex items-center gap-1 rounded-md bg-muted py-0.5 pr-0.5 pl-2 text-xs"
            >
              {options.find((option) => option.value === value)
                ?.chipContent ?? (
                <span className="font-mono font-semibold">{value}</span>
              )}
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                title={`Retirer ${value}`}
                className="size-4 text-muted-foreground hover:text-foreground"
                onClick={() => toggleValue(value)}
              >
                <Icon icon={ICONS.cancel} className="size-3" />
              </Button>
            </span>
          ))}
          <PopoverTrigger asChild>
            <button
              type="button"
              className="min-w-24 flex-1 cursor-pointer px-1.5 py-0.5 text-left text-sm text-muted-foreground outline-hidden"
            >
              {values.length === 0 ? placeholder : addMoreLabel}
            </button>
          </PopoverTrigger>
        </div>
      </PopoverAnchor>
      <PopoverContent
        align="start"
        className="w-(--radix-popover-trigger-width) corner-squircle p-1.5"
      >
        <ComboboxPanel
          {...{ options, searchPlaceholder, emptyLabel }}
          isSelected={(optionValue) => values.includes(optionValue)}
          onSelect={toggleValue}
        />
      </PopoverContent>
    </Popover>
  );
}
