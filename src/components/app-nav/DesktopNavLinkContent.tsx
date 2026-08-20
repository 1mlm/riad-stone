"use client";

import { Loading01Icon } from "@hugeicons/core-free-icons";
import { useLinkStatus } from "next/link";
import { Icon } from "@/components/Icon";
import { cn } from "@/shadcn/utils";
import type { AppNavItem } from "./types";

// reads the pending status of the nearest ancestor <Link> — must be a
// child of that Link to see its navigation context. While pending, swaps
// the icon to a spinner and blocks further clicks with a cursor-wait
// overlay (absolutely positioned against the relative SidebarMenuItem,
// which tightly wraps the button) until the new page lands
export function DesktopNavLinkContent({
  icon,
  label,
  count,
}: {
  icon: AppNavItem["icon"];
  label: string;
  count?: number;
}) {
  const { pending } = useLinkStatus();

  return (
    <>
      {/* sits on top of the anchor and simply intercepts the click — no
      handler needed, a plain element on top of it already stops the
      pointer event from reaching the link underneath */}
      {pending && (
        <span className="absolute inset-0 z-10 cursor-wait" aria-hidden />
      )}
      <Icon
        icon={pending ? Loading01Icon : icon}
        className={cn(pending && "animate-spin")}
      />
      <span className={cn(pending && "opacity-60")}>{label}</span>
      {Boolean(count) && (
        <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-muted px-1.5 text-xs text-muted-foreground group-data-[collapsible=icon]:hidden">
          {count}
        </span>
      )}
    </>
  );
}
