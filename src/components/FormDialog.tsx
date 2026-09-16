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
import { cn } from "@/shadcn/utils";
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
  wide,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trigger: ReactNode;
  title: ReactNode;
  description: string;
  formAction: (formData: FormData) => void;
  pending: boolean;
  error: string | null;
  submitIcon: HugeIcon;
  submitLabel: ReactNode;
  submitVariant?: ComponentProps<typeof Button>["variant"];
  submitDisabled?: boolean;
  // lets the multi-fiche add dialogs grow on bigger screens so more than one
  // fiche fits side by side, instead of staying at the single-column width the
  // edit dialogs want
  wide?: boolean;
  children: ReactNode;
}) {
  return (
    <Dialog {...{ open, onOpenChange }}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent
        className={cn(
          "flex max-h-[calc(100dvh-2rem)] flex-col",
          wide ? "sm:max-w-lg lg:max-w-3xl xl:max-w-5xl" : "sm:max-w-md",
        )}
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription className="sr-only">
            {description}
          </DialogDescription>
        </DialogHeader>
        <form
          action={formAction}
          className="flex min-h-0 min-w-0 flex-col gap-4 overflow-x-hidden overflow-y-auto"
        >
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
