"use client";

import type { ReactNode } from "react";
import { useIsMobile } from "@/shadcn/hooks/use-mobile";
import { Popover, PopoverContent, PopoverTrigger } from "@/shadcn/ui/popover";
import { Sheet, SheetContent, SheetTrigger } from "@/shadcn/ui/sheet";

// desktop popovers anchored near a screen edge (e.g. a sidebar footer button)
// can overflow off-viewport on narrow phone screens — a bottom sheet is the
// obvious, unclipped equivalent there
export function ResponsivePopover({
  open,
  onOpenChange,
  trigger,
  children,
  className,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trigger: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  const isMobile = useIsMobile();

  if (isMobile)
    return (
      <Sheet {...{ open, onOpenChange }}>
        <SheetTrigger asChild>{trigger}</SheetTrigger>
        <SheetContent side="bottom" {...{ className }}>
          {children}
        </SheetContent>
      </Sheet>
    );

  return (
    <Popover {...{ open, onOpenChange }}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent side="right" align="end" {...{ className }}>
        {children}
      </PopoverContent>
    </Popover>
  );
}
