"use client";

import { Key01Icon, ViewIcon } from "@hugeicons/core-free-icons";
import { type FormEvent, useState } from "react";
import { FormError } from "@/components/FormError";
import { Icon } from "@/components/Icon";
import { SubmitButton } from "@/components/SubmitButton";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/shadcn/ui/input-group";
import { Popover, PopoverContent, PopoverTrigger } from "@/shadcn/ui/popover";
import { revealHistoryCode } from "./actions";

// the login code this reveals is the same shared secret that unlocks the
// app, so the server never sends the plaintext down until the viewer proves
// they already know it — a CSS blur on a value already in the page wouldn't
// actually stop anyone from reading it via devtools/view-source
export function RevealSecretValue({ eventId }: { eventId: number }) {
  const [revealedValue, setRevealedValue] = useState<string>();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [error, setError] = useState(false);
  const [pending, setPending] = useState(false);

  if (revealedValue !== undefined) return <span>{revealedValue}</span>;

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setPending(true);
    const code = await revealHistoryCode(eventId, input);
    setPending(false);
    if (code === null) {
      setError(true);
      return;
    }
    setRevealedValue(code);
    setOpen(false);
  };

  return (
    <Popover
      {...{ open }}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (nextOpen) {
          setInput("");
          setError(false);
        }
      }}
    >
      <PopoverTrigger asChild>
        <button
          type="button"
          className="select-none rounded-sm text-left tracking-widest"
        >
          ••••••••
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-64">
        <form onSubmit={handleSubmit} className="flex flex-col gap-2">
          <InputGroup>
            <InputGroupAddon>
              <Icon icon={Key01Icon} />
            </InputGroupAddon>
            <InputGroupInput
              type="password"
              placeholder="Code secret"
              autoFocus
              value={input}
              onChange={(event) => {
                setInput(event.target.value);
                setError(false);
              }}
              aria-invalid={error}
            />
          </InputGroup>
          <SubmitButton size="sm" icon={ViewIcon} {...{ pending }}>
            Afficher
          </SubmitButton>
          {error && <FormError>Code incorrect</FormError>}
        </form>
      </PopoverContent>
    </Popover>
  );
}
