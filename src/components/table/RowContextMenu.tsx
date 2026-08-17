"use client";

import { CheckmarkCircle02Icon, Copy01Icon } from "@hugeicons/core-free-icons";
import type { ComponentProps, ReactElement, ReactNode } from "react";
import { createContext, useContext, useRef, useState } from "react";
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
const COPY_FEEDBACK_MS = 650;

// lets a menu item (Copy) delay the menu's close instead of the instant
// close-on-select every real ContextMenuItem gets by default — used to show
// a brief "copied" state in place before the menu goes away, instead of a
// toast popping up somewhere else on screen
const RowMenuCloseContext = createContext<(() => void) | null>(null);

function useRowMenuClose() {
  const close = useContext(RowMenuCloseContext);
  if (!close) {
    throw new Error("useRowMenuClose must be used inside a RowContextMenu");
  }
  return close;
}

// a row context menu item that must stay mounted after being clicked (it
// opens a nested Dialog/Popover of its own) can't be a real ContextMenuItem —
// selecting one closes and unmounts the whole menu content, which would tear
// down the nested dialog's state along with it. This is styled to match
// ContextMenuItem but is a plain button so clicking it doesn't trigger that
// close-and-unmount behavior. It's always used as a Dialog/PopoverTrigger's
// asChild target, which clones it and overwrites its own data-slot/className
// merge in ways that make it unreliable to target from outside CSS — styled
// entirely with its own classes instead, no data-slot dependency. No
// explicit cursor class either: it's a real <button>, the global
// `button:not(:disabled)` rule in globals.css already gives it a pointer
export function RowMenuItemButton({
  icon,
  children,
  className,
  ...props
}: ComponentProps<"button"> & { icon: HugeIcon }) {
  return (
    <button
      type="button"
      className={cn(
        "flex w-full items-center gap-1.5 rounded-md px-1.5 py-1 text-left text-sm outline-hidden select-none hover:bg-foreground/10 focus:bg-foreground/10 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className,
      )}
      {...props}
    >
      <Icon {...{ icon }} />
      {children}
    </button>
  );
}

// swaps its own icon/label to a checkmark/"Copied" in place instead of
// popping a toast — a toast draws the eye away from the row that was just
// acted on, this keeps the feedback right where the click happened
export function CopyRowMenuItem({
  value,
  label,
  copiedLabel,
}: {
  value: string;
  label: string;
  copiedLabel: string;
}) {
  const closeMenu = useRowMenuClose();
  const [copied, setCopied] = useState(false);

  return (
    <ContextMenuItem
      onSelect={(event) => {
        event.preventDefault();
        copyToClipboard(value);
        haptic("light");
        setCopied(true);
        setTimeout(closeMenu, COPY_FEEDBACK_MS);
      }}
    >
      <Icon icon={copied ? CheckmarkCircle02Icon : Copy01Icon} />
      {copied ? copiedLabel : label}
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
  onOpen,
}: {
  trigger: ReactElement;
  children: ReactNode;
  // fires once per successful open (real right-click or a completed
  // long-press) — not on an attempted-then-cancelled one
  onOpen?: () => void;
}) {
  const [open, setOpen] = useState(false);
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
    <ContextMenu
      {...{ open }}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (nextOpen) onOpen?.();
      }}
    >
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
      <ContextMenuContent>
        <RowMenuCloseContext.Provider value={() => setOpen(false)}>
          {children}
        </RowMenuCloseContext.Provider>
      </ContextMenuContent>
    </ContextMenu>
  );
}
