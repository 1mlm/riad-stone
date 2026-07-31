"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/Icon";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/shadcn/ui/sidebar";
import { APP_HEADER, NAV_ITEMS } from "./data";
import { LogoutButton } from "./LogoutButton";
import { SettingsButton } from "./SettingsButton";

export type NavCounts = Record<"entrees" | "sorties" | "stock", number>;

export function AppSidebar({ counts }: { counts: NavCounts }) {
  const pathname = usePathname();

  return (
    <>
      <Sidebar variant="inset" collapsible="icon">
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                size="lg"
                className="rounded-full corner-squircle select-none! active:bg-sidebar hover:bg-sidebar cursor-auto"
              >
                <Image
                  src={APP_HEADER.iconSrc}
                  alt={APP_HEADER.text}
                  width={32}
                  height={32}
                  className="size-6 shrink-0 group-data-[collapsible=icon]:size-8"
                />
                <div className="flex flex-col leading-none group-data-[collapsible=icon]:hidden">
                  <span className="font-semibold">{APP_HEADER.text}</span>
                  {APP_HEADER.subtext && (
                    <span className="text-xs text-muted-foreground">
                      {APP_HEADER.subtext}
                    </span>
                  )}
                </div>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu className="px-2">
            {NAV_ITEMS.map((item) => {
              const isActive = pathname.startsWith(item.href);
              return (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive}
                    tooltip={item.label}
                    className="rounded-full corner-squircle"
                  >
                    <Link href={item.href}>
                      <Icon icon={item.icon} />
                      <span>{item.label}</span>
                      {item.countKey && counts[item.countKey] > 0 && (
                        <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-muted px-1.5 text-xs text-muted-foreground group-data-[collapsible=icon]:hidden">
                          {counts[item.countKey]}
                        </span>
                      )}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <SettingsButton />
            </SidebarMenuItem>
            <LogoutButton />
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarRail />
    </>
  );
}
