"use client";

import { Copy01Icon } from "@hugeicons/core-free-icons";
import type { ComponentProps, ReactElement, ReactNode } from "react";
import { useRef } from "react";
import { toast } from "sonner";
import { type HugeIcon, Icon } from "@/components/Icon";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/shadcn/ui/context-menu";
import { cn } from "@/shadcn/utils";
import { copyToClipboard } from "@/utils/clipboard";
import { haptic } from "@/utils/haptics";

const LONG_PRESS_MS = 450;
const MOVE_CANCEL_THRESHOLD_PX = 10;

// a row context menu item that must stay mounted after being clicked (it
// opens a nested Dialog/Popover of its own) can't be a real ContextMenuItem —
// selecting one closes and unmounts the whole menu content, which would tear
// down the nested dialog's state along with it. This is styled to match
// ContextMenuItem but is a plain button so clicking it doesn't trigger that
// close-and-unmount behavior
export function RowMenuItemButton({
  icon,
  children,
  className,
  ...props
}: ComponentProps<"button"> & { icon: HugeIcon }) {
  return (
    <button
      type="button"
      data-slot="context-menu-item"
      className={cn(
        "flex w-full cursor-default items-center gap-1.5 rounded-md px-1.5 py-1 text-left text-sm outline-hidden select-none hover:bg-foreground/10 focus:bg-foreground/10 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className,
      )}
      {...props}
    >
      <Icon {...{ icon }} />
      {children}
    </button>
  );
}

// safe as a real ContextMenuItem — copying doesn't open anything that needs
// to survive the menu closing, it just needs a toast since the item (and its
// old icon-swap feedback) unmounts the instant it's selected
export function CopyRowMenuItem({
  value,
  label,
  toastMessage,
}: {
  value: string;
  label: string;
  toastMessage: string;
}) {
  return (
    <ContextMenuItem
      onSelect={() => {
        copyToClipboard(value);
        haptic("light");
        toast(toastMessage);
      }}
    >
      <Icon icon={Copy01Icon} />
      {label}
    </ContextMenuItem>
  );
}

// desktop gets the browser's native right-click for free via ContextMenuTrigger.
// mobile has no equivalent, so a held touch times out into a synthetic
// "contextmenu" event at the touch point — Radix's trigger listens for that
// native event regardless of how it was dispatched, so this reuses its own
// positioning logic instead of reimplementing it
export function RowContextMenu({
  trigger,
  children,
}: {
  trigger: ReactElement;
  children: ReactNode;
}) {
  const elementRef = useRef<HTMLElement | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const startRef = useRef<{ x: number; y: number } | null>(null);

  const cancelLongPress = () => {
    clearTimeout(timerRef.current);
    startRef.current = null;
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.pointerType !== "touch") return;
    startRef.current = { x: e.clientX, y: e.clientY };
    timerRef.current = setTimeout(() => {
      const start = startRef.current;
      if (!start) return;
      elementRef.current?.dispatchEvent(
        new MouseEvent("contextmenu", {
          bubbles: true,
          cancelable: true,
          clientX: start.x,
          clientY: start.y,
        }),
      );
      startRef.current = null;
    }, LONG_PRESS_MS);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    const start = startRef.current;
    if (!start) return;
    const distance = Math.hypot(e.clientX - start.x, e.clientY - start.y);
    if (distance > MOVE_CANCEL_THRESHOLD_PX) cancelLongPress();
  };

  return (
    <ContextMenu>
      <ContextMenuTrigger
        asChild
        ref={elementRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={cancelLongPress}
        onPointerCancel={cancelLongPress}
      >
        {trigger}
      </ContextMenuTrigger>
      <ContextMenuContent>{children}</ContextMenuContent>
    </ContextMenu>
  );
}
