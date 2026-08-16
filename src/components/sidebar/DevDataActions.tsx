"use client";

import { NuclearPowerIcon, Plant01Icon } from "@hugeicons/core-free-icons";
import { useEffect, useState } from "react";
import { clearAllData, isStockEmpty, seedFakeData } from "@/app/(app)/actions";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { Icon } from "@/components/Icon";
import { fr } from "@/messages/fr";
import { Button } from "@/shadcn/ui/button";
import { Separator } from "@/shadcn/ui/separator";
import { cn } from "@/shadcn/utils";

// dev-only seed/clear actions, shared between the desktop settings popover
// and the mobile "more" sheet — never rendered in production
export function DevDataActions({
  open,
  onSeeded,
  buttonClassName,
  withSeparator,
  leadingSeparator,
}: {
  open: boolean;
  onSeeded?: () => void;
  buttonClassName?: string;
  withSeparator?: boolean;
  leadingSeparator?: boolean;
}) {
  const [stockEmpty, setStockEmpty] = useState(false);

  useEffect(() => {
    if (open) isStockEmpty().then(setStockEmpty);
  }, [open]);

  if (process.env.NODE_ENV === "production") return null;

  const handleClearAllData = async () => {
    await clearAllData();
    setStockEmpty(true);
    return undefined;
  };

  const handleSeedFakeData = async () => {
    await seedFakeData();
    onSeeded?.();
    return undefined;
  };

  return (
    <>
      {leadingSeparator && <Separator />}
      <ConfirmDialog
        trigger={
          <Button
            variant="destructive"
            className={cn("rounded-full corner-squircle", buttonClassName)}
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
          {withSeparator && <Separator />}
          <ConfirmDialog
            trigger={
              <Button
                variant="secondary"
                className={cn("rounded-full corner-squircle", buttonClassName)}
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
    </>
  );
}
