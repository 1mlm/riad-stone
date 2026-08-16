"use client";

import type { PropsWithChildren } from "react";
import { SidebarInset, SidebarProvider } from "@/shadcn/ui/sidebar";
import { AppSidebar, type NavCounts } from "./AppSidebar";
import { MobileTopBar } from "./MobileTopBar";

export function AppShell({
  counts,
  children,
}: PropsWithChildren<{ counts: NavCounts }>) {
  return (
    <SidebarProvider>
      <AppSidebar {...{ counts }} />
      <SidebarInset className="md:h-[calc(100svh-2rem)] md:overflow-y-auto">
        <MobileTopBar {...{ counts }} />
        <div className="pt-20 sm:pt-0">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
