"use client";

import {
  Loading01Icon,
  LogoutIcon,
  NuclearPowerIcon,
  Plant01Icon,
} from "@hugeicons/core-free-icons";
import Image from "next/image";
import Link, { useLinkStatus } from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import {
  clearAllData,
  isStockEmpty,
  logout,
  seedFakeData,
} from "@/app/(app)/actions";
import { ConfirmDialog } from "@/components/ConfirmDialog";
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
  const [stockEmpty, setStockEmpty] = useState(false);
  const [loggingOut, startLogoutTransition] = useTransition();

  useEffect(() => {
    if (open) isStockEmpty().then(setStockEmpty);
  }, [open]);

  const handleClearAllData = async () => {
    await clearAllData();
    setStockEmpty(true);
    return undefined;
  };

  const handleSeedFakeData = async () => {
    await seedFakeData();
    setOpen(false);
    return undefined;
  };

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
          <span className="text-[0.65rem]">More</span>
        </button>
      </SheetTrigger>
      <SheetContent side="bottom" className="gap-3 p-4">
        <SheetHeader className="sr-only p-0">
          <SheetTitle>Plus d'options</SheetTitle>
          <SheetDescription>Paramètres et déconnexion</SheetDescription>
        </SheetHeader>
        <ConfirmDialog
          trigger={
            <Button
              variant="destructive"
              className="w-full rounded-full corner-squircle"
            >
              <Icon icon={NuclearPowerIcon} />
              Vider toutes les données
            </Button>
          }
          title="Vider toutes les données ?"
          content="Toutes les entrées et sorties seront supprimées définitivement. Cette action est irréversible."
          confirmLabel="Tout supprimer"
          confirmIcon={NuclearPowerIcon}
          onConfirm={handleClearAllData}
        />
        {stockEmpty && (
          <ConfirmDialog
            trigger={
              <Button
                variant="secondary"
                className="w-full rounded-full corner-squircle"
              >
                <Icon icon={Plant01Icon} />
                Ajouter des données fictives
              </Button>
            }
            title="Ajouter des données fictives ?"
            content="Des entrées, sorties et un historique fictifs seront ajoutés au stock actuel."
            confirmLabel="Ajouter"
            confirmIcon={Plant01Icon}
            confirmVariant="secondary"
            onConfirm={handleSeedFakeData}
          />
        )}
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
}: {
  label: string;
  icon: (typeof NAV_ITEMS)[number]["icon"];
  isActive: boolean;
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
      <Icon
        icon={pending ? Loading01Icon : icon}
        className={cn("size-5", pending && "animate-spin")}
      />
      <span className="text-[0.65rem]">{label}</span>
    </div>
  );
}

function NavLink({ href, label, icon }: (typeof NAV_ITEMS)[number]) {
  const pathname = usePathname();
  const isActive = pathname.startsWith(href);

  return (
    <Link
      href={href}
      onClick={() => haptic("light")}
      className="flex flex-1 flex-col items-center py-2.5"
    >
      <NavLinkContent {...{ label, icon, isActive }} />
    </Link>
  );
}

export function MobileTopBar() {
  const hidden = useHideOnScrollDown();

  return (
    <nav
      className={cn(
        "fixed inset-x-4 top-4 z-20 flex overflow-hidden rounded-t-[1.75rem] rounded-b-full corner-squircle border border-border/50 bg-sidebar/90 shadow-lg backdrop-blur-sm transition-transform duration-200 ease-in-out sm:hidden",
        hidden && "-translate-y-[calc(100%+2rem)]",
      )}
    >
      <MoreSheet />
      {NAV_ITEMS.map((item) => (
        <NavLink key={item.href} {...item} />
      ))}
    </nav>
  );
}
