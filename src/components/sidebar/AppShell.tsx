"use client";

import { Loading01Icon, LogoutIcon } from "@hugeicons/core-free-icons";
import type { PropsWithChildren } from "react";
import { useTransition } from "react";
import { logout } from "@/app/(app)/actions";
import { AppNav } from "@/components/app-nav/AppNav";
import { Icon } from "@/components/Icon";
import { Button } from "@/shadcn/ui/button";
import { SidebarMenuItem } from "@/shadcn/ui/sidebar";
import { DevDataActions } from "./DevDataActions";
import { APP_HEADER, NAV_ITEMS } from "./data";
import { LogoutButton } from "./LogoutButton";
import { SettingsButton } from "./SettingsButton";

function MobileLogoutButton() {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      variant="outline"
      disabled={pending}
      onClick={() => startTransition(() => logout())}
      className="w-full rounded-full corner-squircle text-destructive hover:bg-destructive/10 hover:text-destructive"
    >
      <Icon
        icon={pending ? Loading01Icon : LogoutIcon}
        className={pending ? "animate-spin" : undefined}
      />
      Déconnexion
    </Button>
  );
}

export type NavCounts = Record<
  "entrees" | "sorties" | "stock" | "historique",
  number
>;

export function AppShell({
  counts,
  children,
}: PropsWithChildren<{ counts: NavCounts }>) {
  return (
    <AppNav
      brand={APP_HEADER}
      items={NAV_ITEMS}
      {...{ counts }}
      sidebarFooter={
        <>
          <SidebarMenuItem>
            <SettingsButton />
          </SidebarMenuItem>
          <LogoutButton />
        </>
      }
      sheetTitle="Plus d'options"
      sheetDescription="Paramètres et déconnexion"
      sheetFooter={({ open, close }) => (
        <>
          <MobileLogoutButton />
          <DevDataActions
            {...{ open }}
            onSeeded={close}
            buttonClassName="w-full"
            leadingSeparator
          />
        </>
      )}
    >
      {children}
    </AppNav>
  );
}
