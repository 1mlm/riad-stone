"use client";

import type { ReactElement, ReactNode } from "react";
import { useRef } from "react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuTrigger,
} from "@/shadcn/ui/context-menu";

const LONG_PRESS_MS = 450;
const MOVE_CANCEL_THRESHOLD_PX = 10;

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
