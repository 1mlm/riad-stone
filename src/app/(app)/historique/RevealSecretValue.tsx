"use client";

import { Key01Icon, ViewIcon } from "@hugeicons/core-free-icons";
import { type FormEvent, useState } from "react";
import { FormError } from "@/components/FormError";
import { Icon } from "@/components/Icon";
import { Button } from "@/shadcn/ui/button";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/shadcn/ui/input-group";
import { Popover, PopoverContent, PopoverTrigger } from "@/shadcn/ui/popover";
import { verifyRevealCode } from "./actions";

// the login code shown here is the same shared secret that unlocks the app,
// so leaving it in plain view would let anyone glancing at this page forge a
// permanent session cookie — blur it until the viewer re-enters the code
export function RevealSecretValue({ value }: { value: string }) {
  const [revealed, setRevealed] = useState(false);
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [error, setError] = useState(false);
  const [pending, setPending] = useState(false);

  if (revealed) return <span>{value}</span>;

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setPending(true);
    const correct = await verifyRevealCode(input);
    setPending(false);
    if (!correct) {
      setError(true);
      return;
    }
    setRevealed(true);
    setOpen(false);
  };

  return (
    <Popover
      open={open}
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
          className="select-none rounded-sm text-left blur-[3px] transition-[filter] hover:blur-[1.5px] focus-visible:blur-none"
        >
          {value}
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
          <Button type="submit" size="sm" disabled={pending}>
            <Icon icon={ViewIcon} />
            Afficher
          </Button>
          {error && <FormError>Code incorrect</FormError>}
        </form>
      </PopoverContent>
    </Popover>
  );
}
