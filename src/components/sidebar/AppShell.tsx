"use client";

import type { PropsWithChildren } from "react";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/shadcn/ui/sidebar";
import { AppSidebar, type NavCounts } from "./AppSidebar";
import { MobileBottomBar } from "./MobileBottomBar";

export function AppShell({
  counts,
  children,
}: PropsWithChildren<{ counts: NavCounts }>) {
  return (
    <SidebarProvider>
      <AppSidebar {...{ counts }} />
      <SidebarInset>
        <div className="flex items-center border-b border-border p-2 sm:hidden">
          <SidebarTrigger />
        </div>
        <div className="pb-16 sm:pb-0">{children}</div>
        <MobileBottomBar />
      </SidebarInset>
    </SidebarProvider>
  );
}
