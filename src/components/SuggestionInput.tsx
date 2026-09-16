"use client";

import { type ComponentProps, useRef, useState } from "react";
import { InputGroup, InputGroupInput } from "@/shadcn/ui/input-group";
import { Popover, PopoverAnchor, PopoverContent } from "@/shadcn/ui/popover";
import { cn } from "@/shadcn/utils";
import { haptic } from "@/utils/haptics";

// a free-text input that offers past values, replacing the native <datalist>
// it used to use: Chrome draws that dropdown itself, ignoring the app's
// fonts, colours and theme entirely, and it can't be styled.
//
// The input stays uncontrolled on purpose — the multi-fiche forms read fiche
// values straight off the DOM (see useCardCarousel and restoreFormValues), so
// picking a suggestion writes to the input and fires an input event rather
// than lifting the value into React state
export function SuggestionInput({
  suggestions,
  className,
  ...inputProps
}: { suggestions: string[] } & ComponentProps<typeof InputGroupInput>) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const matches = suggestions.filter((suggestion) => {
    const trimmed = query.trim().toLowerCase();
    return (
      suggestion.toLowerCase().includes(trimmed) &&
      suggestion.toLowerCase() !== trimmed
    );
  });

  const pick = (suggestion: string) => {
    const input = inputRef.current;
    if (!input) return;
    haptic("selection");
    input.value = suggestion;
    // the fiche forms listen for input events to recompute totals, and the
    // input is uncontrolled so nothing else would tell them it changed
    input.dispatchEvent(new Event("input", { bubbles: true }));
    setQuery(suggestion);
    setOpen(false);
    input.focus();
  };

  return (
    <Popover open={open && matches.length > 0} onOpenChange={setOpen}>
      <PopoverAnchor asChild>
        <InputGroup className="corner-squircle">
          <InputGroupInput
            ref={inputRef}
            // the browser's own autofill dropdown would sit on top of this one
            autoComplete="off"
            className={cn(className)}
            {...inputProps}
            onInput={(event) => {
              setQuery(event.currentTarget.value);
              setOpen(true);
              inputProps.onInput?.(event);
            }}
            onFocus={(event) => {
              setQuery(event.currentTarget.value);
              setOpen(true);
              inputProps.onFocus?.(event);
            }}
            onKeyDown={(event) => {
              if (event.key === "Escape") setOpen(false);
              inputProps.onKeyDown?.(event);
            }}
          />
        </InputGroup>
      </PopoverAnchor>
      <PopoverContent
        align="start"
        // keeps the caret in the input so typing carries on filtering
        onOpenAutoFocus={(event) => event.preventDefault()}
        // the input is the anchor, not a PopoverTrigger, so Radix counts
        // clicks on it as outside the popover — without this, the very click
        // that focuses the field dismisses the list it just opened
        onInteractOutside={(event) => {
          if (event.target === inputRef.current) event.preventDefault();
        }}
        className="max-h-56 w-(--radix-popover-trigger-width) overflow-y-auto corner-squircle p-1.5"
      >
        {matches.map((suggestion) => (
          <button
            key={suggestion}
            type="button"
            onClick={() => pick(suggestion)}
            className="flex w-full cursor-pointer items-center rounded-sm px-2 py-1.5 text-left text-sm outline-hidden hover:bg-muted focus-visible:bg-muted"
          >
            {suggestion}
          </button>
        ))}
      </PopoverContent>
    </Popover>
  );
}
