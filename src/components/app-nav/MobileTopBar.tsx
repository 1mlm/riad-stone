"use client";

import { Loading01Icon, MoreHorizontalIcon } from "@hugeicons/core-free-icons";
import Image from "next/image";
import Link, { useLinkStatus } from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useState } from "react";
import { Icon } from "@/components/Icon";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/shadcn/ui/sheet";
import { cn } from "@/shadcn/utils";
import { haptic } from "@/utils/haptics";
import type { AppNavBrand, AppNavItem } from "./types";
import { useHideOnScrollDown } from "./useHideOnScrollDown";

export type SheetFooterRenderer = (context: {
  open: boolean;
  close: () => void;
}) => ReactNode;

function MoreSheet({
  brand,
  sheetTitle,
  sheetDescription,
  sheetFooter,
}: {
  brand: AppNavBrand;
  sheetTitle: string;
  sheetDescription: string;
  sheetFooter: SheetFooterRenderer;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet {...{ open, onOpenChange: setOpen }}>
      <SheetTrigger asChild>
        <button
          type="button"
          onClick={() => haptic("light")}
          className="flex flex-1 flex-col items-center gap-0.5 py-2.5 text-muted-foreground"
        >
          <Icon icon={MoreHorizontalIcon} className="size-5" />
          <span className="text-[0.65rem]">Plus</span>
        </button>
      </SheetTrigger>
      <SheetContent side="bottom" className="gap-3 p-4" showCloseButton={false}>
        <SheetHeader className="sr-only p-0">
          <SheetTitle>{sheetTitle}</SheetTitle>
          <SheetDescription>{sheetDescription}</SheetDescription>
        </SheetHeader>
        <div className="flex flex-col items-center gap-1 pb-1">
          <Image
            src={brand.iconSrc}
            alt={brand.text}
            width={32}
            height={32}
            className="size-8"
          />
          <span className="font-semibold">{brand.text}</span>
          {brand.subtext && (
            <span className="text-xs text-muted-foreground">
              {brand.subtext}
            </span>
          )}
        </div>
        {sheetFooter({ open, close: () => setOpen(false) })}
      </SheetContent>
    </Sheet>
  );
}

// reads the pending status of the nearest ancestor <Link> — must be a
// child of that Link to see its navigation context
function NavLinkContent({
  label,
  icon,
  isActive,
  count,
}: {
  label: string;
  icon: AppNavItem["icon"];
  isActive: boolean;
  count?: number;
}) {
  const { pending } = useLinkStatus();

  return (
    <div
      className={cn(
        "flex flex-col items-center gap-0.5 text-muted-foreground",
        isActive && "text-foreground",
        pending && "opacity-60",
      )}
    >
      <div className="relative">
        <Icon
          icon={pending ? Loading01Icon : icon}
          className={cn("size-5", pending && "animate-spin")}
        />
        {!pending && Boolean(count) && (
          <span className="absolute -top-1.5 -right-2.5 flex h-4 min-w-4 items-center justify-center rounded-full corner-squircle bg-muted px-1 text-[0.6rem] text-muted-foreground">
            {count}
          </span>
        )}
      </div>
      <span className="text-[0.65rem]">{label}</span>
    </div>
  );
}

function NavLink({
  href,
  label,
  icon,
  count,
}: AppNavItem & { count?: number }) {
  const pathname = usePathname();
  const isActive = pathname.startsWith(href);

  return (
    <Link
      {...{ href }}
      onClick={() => haptic("light")}
      className="flex flex-1 flex-col items-center py-2.5"
    >
      <NavLinkContent {...{ label, icon, isActive, count }} />
    </Link>
  );
}

export function MobileTopBar({
  brand,
  items,
  counts,
  sheetTitle = "More options",
  sheetDescription = "Settings and account actions",
  sheetFooter,
}: {
  brand: AppNavBrand;
  items: AppNavItem[];
  counts: Record<string, number>;
  sheetTitle?: string;
  sheetDescription?: string;
  sheetFooter: SheetFooterRenderer;
}) {
  const hidden = useHideOnScrollDown();

  return (
    <nav
      className={cn(
        "fixed inset-x-4 top-4 z-20 flex overflow-hidden rounded-t-[1.5rem]! rounded-b-[2rem]! corner-squircle border border-border/50 bg-sidebar/90 shadow-lg backdrop-blur-sm transition-transform duration-200 ease-in-out sm:hidden",
        hidden && "-translate-y-[calc(100%+2rem)]",
      )}
    >
      {items.map((item) => (
        <NavLink
          key={item.href}
          {...item}
          count={item.countKey ? counts[item.countKey] : undefined}
        />
      ))}
      <MoreSheet {...{ brand, sheetTitle, sheetDescription, sheetFooter }} />
    </nav>
  );
}
