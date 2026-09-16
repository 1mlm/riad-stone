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
  contentWidth,
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
  // an explicit CSS width for the multi-fiche add flows, which size
  // themselves to how many fiches they're showing (see
  // getCarouselDialogWidth) rather than sitting at a fixed wide size that
  // leaves a lone fiche stranded in empty space. Left unset, the dialog keeps
  // the single-column width the edit dialogs want
  contentWidth?: string;
  children: ReactNode;
}) {
  return (
    <Dialog {...{ open, onOpenChange }}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent
        style={contentWidth ? { width: contentWidth } : undefined}
        className={cn(
          "flex max-h-[calc(100dvh-2rem)] flex-col",
          // the sm: variant too: DialogContent ships sm:max-w-sm, which a
          // bare max-w-none doesn't override at or above that breakpoint
          contentWidth ? "max-w-none sm:max-w-none" : "sm:max-w-md",
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
