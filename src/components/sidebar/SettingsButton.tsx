"use client";

import {
  ArrowRight01Icon,
  SlidersVerticalIcon,
} from "@hugeicons/core-free-icons";
import { useState } from "react";
import { Icon } from "@/components/Icon";
import { ResponsivePopover } from "@/components/ResponsivePopover";
import { SidebarMenuButton } from "@/shadcn/ui/sidebar";
import { DevDataActions } from "./DevDataActions";

export function SettingsButton() {
  const [open, setOpen] = useState(false);

  return (
    <ResponsivePopover
      {...{ open, onOpenChange: setOpen }}
      trigger={
        <SidebarMenuButton className="rounded-full corner-squircle">
          <Icon icon={SlidersVerticalIcon} />
          <span>Paramètres</span>
          <Icon
            icon={ArrowRight01Icon}
            className="ml-auto text-muted-foreground"
          />
        </SidebarMenuButton>
      }
      className="flex flex-col gap-2"
    >
      <DevDataActions
        {...{ open }}
        onSeeded={() => setOpen(false)}
        withSeparator
      />
    </ResponsivePopover>
  );
}
