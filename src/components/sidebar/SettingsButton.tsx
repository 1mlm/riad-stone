"use client";

import {
  ArrowRight01Icon,
  NuclearPowerIcon,
  Plant01Icon,
  SlidersVerticalIcon,
} from "@hugeicons/core-free-icons";
import { useEffect, useState } from "react";
import { clearAllData, isStockEmpty, seedFakeData } from "@/app/(app)/actions";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { Icon } from "@/components/Icon";
import { ResponsivePopover } from "@/components/ResponsivePopover";
import { fr } from "@/messages/fr";
import { Button } from "@/shadcn/ui/button";
import { Separator } from "@/shadcn/ui/separator";
import { SidebarMenuButton } from "@/shadcn/ui/sidebar";

export function SettingsButton() {
  const [open, setOpen] = useState(false);
  const [stockEmpty, setStockEmpty] = useState(false);

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
      <ConfirmDialog
        trigger={
          <Button
            variant="destructive"
            className="rounded-full corner-squircle"
          >
            <Icon icon={NuclearPowerIcon} />
            Vider toutes les données
          </Button>
        }
        title="Vider toutes les données ?"
        content="Toutes les entrées et sorties seront supprimées définitivement. Cette action est irréversible."
        confirmLabel="Tout supprimer"
        cancelLabel={fr.common.cancel}
        waitingLabel={fr.common.pleaseWait}
        confirmIcon={NuclearPowerIcon}
        onConfirm={handleClearAllData}
      />
      {stockEmpty && (
        <>
          <Separator />
          <ConfirmDialog
            trigger={
              <Button
                variant="secondary"
                className="rounded-full corner-squircle"
              >
                <Icon icon={Plant01Icon} />
                Ajouter des données fictives
              </Button>
            }
            title="Ajouter des données fictives ?"
            content="Des entrées, sorties et un historique fictifs seront ajoutés au stock actuel."
            confirmLabel="Ajouter"
            cancelLabel={fr.common.cancel}
            waitingLabel={fr.common.pleaseWait}
            confirmIcon={Plant01Icon}
            confirmVariant="secondary"
            onConfirm={handleSeedFakeData}
          />
        </>
      )}
    </ResponsivePopover>
  );
}
