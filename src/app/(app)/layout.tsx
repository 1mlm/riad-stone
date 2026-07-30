"use client";

import type { PropsWithChildren } from "react";
import { AppSidebar } from "@/components/sidebar/AppSidebar";
import { MobileBottomBar } from "@/components/sidebar/MobileBottomBar";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/shadcn/ui/sidebar";

export default function AppLayout({ children }: PropsWithChildren) {
  return (
    <SidebarProvider>
      <AppSidebar />
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
