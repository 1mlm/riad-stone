"use client";

import type { ComponentProps, ReactNode } from "react";
import type { HugeIcon } from "@/components/Icon";
import type { Button } from "@/shadcn/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shadcn/ui/dialog";
import { FormError } from "./FormError";
import { SubmitButton } from "./SubmitButton";

// the Dialog/form/FormError/SubmitButton shell every add/edit dialog in this
// app repeats verbatim — callers only differ in the trigger, title, submit
// icon/label/variant, and the fields themselves
export function FormDialog({
  open,
  onOpenChange,
  trigger,
  title,
  description,
  formAction,
  pending,
  error,
  submitIcon,
  submitLabel,
  submitVariant,
  submitDisabled,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trigger: ReactNode;
  title: string;
  description: string;
  formAction: (formData: FormData) => void;
  pending: boolean;
  error: string | null;
  submitIcon: HugeIcon;
  submitLabel: ReactNode;
  submitVariant?: ComponentProps<typeof Button>["variant"];
  submitDisabled?: boolean;
  children: ReactNode;
}) {
  return (
    <Dialog {...{ open, onOpenChange }}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription className="sr-only">
            {description}
          </DialogDescription>
        </DialogHeader>
        <form action={formAction} className="flex min-w-0 flex-col gap-4">
          {children}
          <FormError>{error}</FormError>
          <DialogFooter>
            <SubmitButton
              icon={submitIcon}
              variant={submitVariant}
              disabled={submitDisabled}
              {...{ pending }}
            >
              {submitLabel}
            </SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
