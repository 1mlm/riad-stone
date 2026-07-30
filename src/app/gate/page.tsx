"use client";

import {
  Alert02Icon,
  Key01Icon,
  SquareUnlock01Icon,
} from "@hugeicons/core-free-icons";
import { useActionState } from "react";
import { Icon } from "@/components/Icon";
import { Button } from "@/shadcn/ui/button";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/shadcn/ui/input-group";
import { unlockWithCode } from "./actions";

export default function GatePage() {
  const [state, formAction, pending] = useActionState(unlockWithCode, {
    error: false,
  });

  return (
    <div className="flex h-screen flex-col items-center justify-center gap-4 p-4">
      <form action={formAction} className="flex w-full max-w-64 flex-col gap-2">
        <InputGroup>
          <InputGroupAddon>
            <Icon icon={Key01Icon} />
          </InputGroupAddon>
          <InputGroupInput
            name="code"
            type="password"
            placeholder="Code secret"
            autoFocus
            aria-invalid={state.error}
          />
        </InputGroup>
        <Button type="submit" disabled={pending}>
          <Icon icon={SquareUnlock01Icon} />
          Déverrouiller
        </Button>
        {state.error && (
          <span className="inline-flex items-center justify-center gap-1.5 text-sm text-destructive">
            <Icon icon={Alert02Icon} />
            Code incorrect
          </span>
        )}
      </form>
    </div>
  );
}
