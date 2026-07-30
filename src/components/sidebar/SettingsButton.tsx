"use client";

import {
  ArrowRight01Icon,
  NuclearPowerIcon,
  Plant01Icon,
  SlidersVerticalIcon,
} from "@hugeicons/core-free-icons";
import { useEffect, useState, useTransition } from "react";
import { clearAllData, isStockEmpty, seedFakeData } from "@/app/(app)/actions";
import { Icon } from "@/components/Icon";
import { ResponsivePopover } from "@/components/ResponsivePopover";
import { Button } from "@/shadcn/ui/button";
import { Separator } from "@/shadcn/ui/separator";
import { SidebarMenuButton } from "@/shadcn/ui/sidebar";

export function SettingsButton() {
  const [open, setOpen] = useState(false);
  const [stockEmpty, setStockEmpty] = useState(false);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (open) isStockEmpty().then(setStockEmpty);
  }, [open]);

  const handleClearAllData = () =>
    startTransition(async () => {
      if (
        !confirm(
          "Supprimer définitivement toutes les entrées et sorties ? Cette action est irréversible.",
        )
      )
        return;
      await clearAllData();
      setStockEmpty(true);
    });

  const handleSeedFakeData = () =>
    startTransition(async () => {
      await seedFakeData();
      setOpen(false);
    });

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
      <Button
        variant="destructive"
        disabled={pending}
        onClick={handleClearAllData}
      >
        <Icon icon={NuclearPowerIcon} />
        Vider toutes les données
      </Button>
      {stockEmpty && (
        <>
          <Separator />
          <Button disabled={pending} variant={"secondary"} onClick={handleSeedFakeData}>
            <Icon icon={Plant01Icon} />
            Ajouter des données fictives
          </Button>
        </>
      )}
    </ResponsivePopover>
  );
}
