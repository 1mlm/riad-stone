"use client";

import { Loading01Icon, LogoutIcon } from "@hugeicons/core-free-icons";
import Image from "next/image";
import Link, { useLinkStatus } from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { logout } from "@/app/(app)/actions";
import { Icon } from "@/components/Icon";
import { Button } from "@/shadcn/ui/button";
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
import type { NavCounts } from "./AppSidebar";
import { DevDataActions } from "./DevDataActions";
import { APP_HEADER, NAV_ITEMS } from "./data";

// hides the bar once the user has scrolled down a bit and is actively
// scrolling further down, brings it back the moment they scroll up —
// the same pattern most mobile apps use for a top bar that shouldn't eat
// screen space while reading
function useHideOnScrollDown() {
  const [hidden, setHidden] = useState(false);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const scrolledPastThreshold = currentScrollY > 64;
      const scrollingDown = currentScrollY > lastScrollY.current;
      setHidden(scrolledPastThreshold && scrollingDown);
      lastScrollY.current = currentScrollY;
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return hidden;
}

function MoreSheet() {
  const [open, setOpen] = useState(false);
  const [loggingOut, startLogoutTransition] = useTransition();

  return (
    <Sheet {...{ open, onOpenChange: setOpen }}>
      <SheetTrigger asChild>
        <button
          type="button"
          onClick={() => haptic("light")}
          className="flex flex-1 flex-col items-center gap-0.5 py-2.5 text-muted-foreground"
        >
          <Image
            src={APP_HEADER.iconSrc}
            alt={APP_HEADER.text}
            width={20}
            height={20}
            className="size-5"
          />
          <span className="text-[0.65rem]">{APP_HEADER.text}</span>
        </button>
      </SheetTrigger>
      <SheetContent side="bottom" className="gap-3 p-4">
        <SheetHeader className="sr-only p-0">
          <SheetTitle>Plus d'options</SheetTitle>
          <SheetDescription>Paramètres et déconnexion</SheetDescription>
        </SheetHeader>
        <Button
          variant="outline"
          disabled={loggingOut}
          onClick={() => startLogoutTransition(() => logout())}
          className="w-full rounded-full corner-squircle text-destructive hover:bg-destructive/10 hover:text-destructive"
        >
          <Icon
            icon={loggingOut ? Loading01Icon : LogoutIcon}
            className={loggingOut ? "animate-spin" : undefined}
          />
          Déconnexion
        </Button>
        <DevDataActions
          {...{ open }}
          onSeeded={() => setOpen(false)}
          buttonClassName="w-full"
          leadingSeparator
        />
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
  icon: (typeof NAV_ITEMS)[number]["icon"];
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
}: (typeof NAV_ITEMS)[number] & { count?: number }) {
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

export function MobileTopBar({ counts }: { counts: NavCounts }) {
  const hidden = useHideOnScrollDown();

  return (
    <nav
      className={cn(
        "fixed inset-x-4 top-4 z-20 flex overflow-hidden rounded-t-[1.5rem]! rounded-b-[2rem]! corner-squircle border border-border/50 bg-sidebar/90 shadow-lg backdrop-blur-sm transition-transform duration-200 ease-in-out sm:hidden",
        hidden && "-translate-y-[calc(100%+2rem)]",
      )}
    >
      <MoreSheet />
      {NAV_ITEMS.map((item) => (
        <NavLink
          key={item.href}
          {...item}
          count={item.countKey ? counts[item.countKey] : undefined}
        />
      ))}
    </nav>
  );
}
