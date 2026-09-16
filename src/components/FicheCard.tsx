"use client";

import type { ReactNode } from "react";
import { FICHE_WIDTH_CLASS } from "@/components/CardCarouselShell";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { Icon } from "@/components/Icon";
import { fr } from "@/messages/fr";
import { Button } from "@/shadcn/ui/button";
import { cn } from "@/shadcn/utils";
import { ICONS } from "@/utils/icon";

// one fiche in a multi-fiche add flow: the confirm/duplicate/delete chrome and
// the confirmed lock, shared by entrées and sorties — only the fields inside
// differ, so they come in as children
export function FicheCard({
  invalid,
  confirmed,
  onToggleConfirmed,
  onDelete,
  onClone,
  cardRef,
  children,
}: {
  invalid: boolean;
  confirmed: boolean;
  onToggleConfirmed: () => void;
  onDelete: () => void;
  onClone: () => void;
  cardRef: (el: HTMLDivElement | null) => void;
  children: ReactNode;
}) {
  return (
    <div
      ref={cardRef}
      className={cn(
        "flex shrink-0 snap-center flex-col gap-4 rounded-lg border border-border p-3 shadow-sm transition-colors",
        FICHE_WIDTH_CLASS,
        confirmed && "border-primary bg-primary/5",
        invalid && "border-destructive",
      )}
    >
      <div className="flex justify-end gap-1">
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          title={confirmed ? "Modifier cette fiche" : "Confirmer cette fiche"}
          className={confirmed ? undefined : "text-primary hover:text-primary"}
          onClick={onToggleConfirmed}
        >
          <Icon icon={confirmed ? ICONS.edit : ICONS.check} />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          title="Dupliquer cette fiche"
          onClick={onClone}
        >
          <Icon icon={ICONS.copy} />
        </Button>
        <ConfirmDialog
          trigger={
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              title="Supprimer cette fiche"
              className="text-destructive hover:text-destructive"
            >
              <Icon icon={ICONS.delete} />
            </Button>
          }
          title="Supprimer cette fiche ?"
          content="Les informations saisies dans cette fiche seront perdues."
          confirmLabel="Supprimer"
          cancelLabel={fr.common.cancel}
          waitingLabel={fr.common.pleaseWait}
          confirmIcon={ICONS.delete}
          waitSeconds={0}
          onConfirm={async () => {
            onDelete();
            return undefined;
          }}
        />
      </div>
      {/* inert (not disabled) so a confirmed fiche can't be typed into or
          tabbed into but its inputs still submit their values with the rest of
          the form — disabled controls are left out of FormData entirely */}
      <div
        inert={confirmed}
        className={cn("flex flex-col gap-4", confirmed && "opacity-60")}
      >
        {children}
      </div>
    </div>
  );
}
